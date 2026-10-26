import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { todayKey } from '@/lib/calendar/utils'
import { cop } from '@/lib/projects/metrics'
import { personalCategory, OTHER_INCOME_OPTIONS, OTHER_INCOME_PREFIX } from '@/lib/expenses/scope'

/** Lógica compartida por los atajos del iPhone (`/api/movimiento` manual y
 * `/api/movimiento/sms` automático): qué opciones mostrar y cómo guardar.
 * Gastos → `expenses` (personales con prefijo, ver scope.ts); ingresos →
 * `payments` del proyecto elegido (igual que la Caja de Inicio) o, sin
 * proyecto, `expenses` con prefijo "Ingreso · ". Devuelve el texto que el
 * atajo muestra en la notificación. */
const BUSINESS = ['Insumos', 'Arriendo', 'Servicios', 'Publicidad', 'Transporte', 'Equipo', 'Otro']
const PERSONAL = ['Comida', 'Transporte', 'Hogar', 'Salud', 'Ocio', 'Deudas', 'Otro']

type OpenProject = {
  id: string
  name: string
  total_value: number | null
  clients: { name: string } | null
  payments: { amount: number }[]
  balance: number
}

async function openProjects(studioId: string): Promise<OpenProject[]> {
  const { data, error } = await createAdminClient()
    .from('projects')
    .select('id, name, total_value, clients(name), payments(amount)')
    .eq('studio_id', studioId)
    .neq('status', 'cancelled')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as Omit<OpenProject, 'balance'>[])
    .map((p) => ({ ...p, balance: (p.total_value ?? 0) - p.payments.reduce((s, x) => s + (x.amount ?? 0), 0) }))
    .filter((p) => p.balance > 0)
}

/** Opción para abonarle a cualquier cliente de la base (no solo a los que
 * deben): el nombre va en la nota y se busca entre todos los clientes. */
export const OTHER_CLIENT_OPTION = 'Otro cliente (escribe su nombre en la nota)'

/** Patrón ILIKE para una palabra del nombre: sin tildes y con las vocales
 * como comodín, así "gonzalez" encuentra "González". */
export function nameWordPattern(word: string): string {
  const plain = word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[%_\\]/g, '')
  return `%${plain.replace(/[aeiou]/g, '_')}%`
}

const normalizeName = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Busca el cliente por el nombre escrito en la nota y le registra el cobro:
 * en su proyecto abierto con saldo suficiente o, si no tiene, en un proyecto
 * nuevo "Abono" aprobado y sin cita (como cuando paga antes de agendar). */
async function payToAnyClient(
  studioId: string,
  name: string | null | undefined,
  monto: number,
  medio: string | null | undefined,
): Promise<SaveResult> {
  const supabase = createAdminClient()
  const words = (name ?? '').split(/\s+/).filter((w) => w.replace(/[^\p{L}]/gu, '').length >= 2)
  if (!words.length) return { ok: false, message: '❌ Escribe el nombre del cliente en la nota' }

  let query = supabase.from('clients').select('id, name').eq('studio_id', studioId)
  for (const w of words) query = query.ilike('name', nameWordPattern(w))
  const { data: found, error } = await query.limit(20)
  if (error) {
    console.error('[movimiento] buscar cliente', error.message)
    return { ok: false, message: '❌ No se pudo buscar el cliente, intenta de nuevo' }
  }
  const target = normalizeName(name ?? '')
  const exact = (found ?? []).filter((c) => normalizeName(c.name ?? '') === target)
  const pick = exact.length === 1 ? exact[0] : found?.length === 1 ? found[0] : null
  if (!pick) {
    if (!found?.length) return { ok: false, message: `❌ No encontré a "${name}" en tus clientes. Revisa cómo está escrito` }
    const names = found
      .slice(0, 5)
      .map((c) => c.name)
      .join(' · ')
    return { ok: false, message: `❌ Hay ${found.length} parecidos: ${names}. Escribe el nombre completo en la nota` }
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, total_value, payments(amount), sessions(status)')
    .eq('studio_id', studioId)
    .eq('client_id', pick.id)
    .neq('status', 'cancelled')
    .order('updated_at', { ascending: false })
  const open = (projects ?? [])
    .map((p) => ({
      ...p,
      balance: (p.total_value ?? 0) - (p.payments ?? []).reduce((s: number, x: { amount: number }) => s + (x.amount ?? 0), 0),
    }))
    .find((p) => p.balance >= monto)
  // Sin saldo suficiente pero con una cita agendada (p. ej. "Cita rápida" sin
  // valor): el abono va a esa cita, no a un proyecto nuevo.
  const withCita = open ? null : (projects ?? []).find((p) => (p.sessions ?? []).some((x: { status: string }) => x.status === 'scheduled'))

  let projectId = open?.id ?? withCita?.id
  let projectName = open?.name ?? withCita?.name ?? 'Abono'
  if (!projectId) {
    const { data: owner } = await supabase.from('artists').select('id').eq('studio_id', studioId).eq('role', 'owner').limit(1).maybeSingle()
    if (!owner) return { ok: false, message: '❌ No se pudo crear el proyecto del cliente' }
    const { data: created, error: createError } = await supabase
      .from('projects')
      .insert({ studio_id: studioId, artist_id: owner.id, client_id: pick.id, name: 'Abono', status: 'approval', total_value: monto })
      .select('id, name')
      .single()
    if (createError || !created) {
      console.error('[movimiento] proyecto nuevo', createError?.message)
      return { ok: false, message: '❌ No se pudo crear el proyecto del cliente' }
    }
    projectId = created.id
    projectName = created.name
  }

  const { error: payError } = await supabase.from('payments').insert({
    studio_id: studioId,
    project_id: projectId,
    amount: monto,
    payment_method: medio || null,
  })
  if (payError) {
    console.error('[movimiento] payment otro cliente', payError.message)
    return { ok: false, message: '❌ No se pudo guardar, intenta de nuevo' }
  }
  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/finanzas')
  const left = open ? open.balance - monto : 0
  return {
    ok: true,
    message: withCita
      ? `✅ Entró ${cop(monto)} · ${pick.name} · ${projectName} (abono a la cita agendada)`
      : open
        ? `✅ Entró ${cop(monto)} · ${pick.name} · ${projectName}${left > 0 ? ` · queda ${cop(left)}` : ' · ¡pagado completo!'}`
        : `✅ Entró ${cop(monto)} · ${pick.name} · proyecto nuevo "Abono" (sin cita todavía)`,
  }
}

const projectLine = (p: OpenProject) => `${p.clients?.name ?? 'Sin cliente'} · ${p.name} · debe ${cop(p.balance)} · #${p.id.slice(0, 6)}`

/** Opciones de "¿De qué?", una por renglón. */
export async function movementOptions(studioId: string, income: boolean): Promise<string[]> {
  if (!income) return [...BUSINESS.map((c) => `Negocio · ${c}`), ...PERSONAL.map((c) => `Personal · ${c}`)]
  const projects = await openProjects(studioId)
  return [OTHER_CLIENT_OPTION, ...OTHER_INCOME_OPTIONS, ...projects.slice(0, 40).map(projectLine)]
}

export type Movement = { income: boolean; monto: number; opcion: string; medio?: string | null; nota?: string | null }
export type SaveResult = { ok: boolean; message: string }

export async function saveMovement(studioId: string, m: Movement): Promise<SaveResult> {
  const supabase = createAdminClient()
  const monto = Math.round(m.monto)
  const description = [m.medio, m.nota].filter(Boolean).join(' · ') || null

  const otherIncome = OTHER_INCOME_OPTIONS.find((o) => o.toLowerCase() === m.opcion.toLowerCase())
  if (m.income && otherIncome) {
    const { error } = await supabase.from('expenses').insert({
      studio_id: studioId,
      category: OTHER_INCOME_PREFIX + otherIncome,
      description,
      amount: monto,
      expense_date: todayKey(),
    })
    if (error) {
      console.error('[movimiento] other income', error.message)
      return { ok: false, message: '❌ No se pudo guardar, intenta de nuevo' }
    }
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings/gastos')
    revalidatePath('/dashboard/settings/finanzas')
    return { ok: true, message: `✅ Entró ${cop(monto)} · ${otherIncome}` }
  }

  if (m.income && m.opcion.trim().toLowerCase() === OTHER_CLIENT_OPTION.toLowerCase()) {
    return payToAnyClient(studioId, m.nota, monto, m.medio)
  }

  if (m.income) {
    const ref = m.opcion.match(/#([0-9a-f]{6})\s*$/i)?.[1]?.toLowerCase()
    if (!ref) return { ok: false, message: '❌ Elige un proyecto de la lista' }
    const project = (await openProjects(studioId)).find((p) => p.id.startsWith(ref))
    if (!project) return { ok: false, message: '❌ Ese proyecto ya no tiene saldo pendiente' }
    if (monto > project.balance) return { ok: false, message: `❌ Supera el saldo pendiente (${cop(project.balance)})` }

    const { error } = await supabase.from('payments').insert({
      studio_id: studioId,
      project_id: project.id,
      amount: monto,
      payment_method: m.medio || null,
      notes: m.nota || null,
    })
    if (error) {
      console.error('[movimiento] payment', error.message)
      return { ok: false, message: '❌ No se pudo guardar, intenta de nuevo' }
    }
    revalidatePath(`/dashboard/projects/${project.id}`)
    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings/finanzas')
    const left = project.balance - monto
    const who = project.clients?.name ?? project.name
    return { ok: true, message: `✅ Entró ${cop(monto)} · ${who}${left > 0 ? ` · queda ${cop(left)}` : ' · ¡pagado completo!'}` }
  }

  const [scope, ...rest] = m.opcion.split(' · ')
  const category = rest.join(' · ').trim() || m.opcion
  const personal = /personal/i.test(scope ?? '')
  const { error } = await supabase.from('expenses').insert({
    studio_id: studioId,
    category: personal ? personalCategory(category) : category.slice(0, 40),
    description,
    amount: monto,
    expense_date: todayKey(),
  })
  if (error) {
    console.error('[movimiento] expense', error.message)
    return { ok: false, message: '❌ No se pudo guardar, intenta de nuevo' }
  }
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return { ok: true, message: `✅ Salió ${cop(monto)} · ${personal ? 'Personal' : 'Negocio'} · ${category}` }
}
