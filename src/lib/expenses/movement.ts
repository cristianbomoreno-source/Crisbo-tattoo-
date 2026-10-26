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

const projectLine = (p: OpenProject) =>
  `${p.clients?.name ?? 'Sin cliente'} · ${p.name} · debe ${cop(p.balance)} · #${p.id.slice(0, 6)}`

/** Opciones de "¿De qué?", una por renglón. */
export async function movementOptions(studioId: string, income: boolean): Promise<string[]> {
  if (!income) return [...BUSINESS.map((c) => `Negocio · ${c}`), ...PERSONAL.map((c) => `Personal · ${c}`)]
  const projects = await openProjects(studioId)
  return [...OTHER_INCOME_OPTIONS, ...projects.slice(0, 40).map(projectLine)]
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
    revalidatePath('/dashboard/settings/gastos')
    revalidatePath('/dashboard/settings/finanzas')
    return { ok: true, message: `✅ Entró ${cop(monto)} · ${otherIncome}` }
  }

  if (m.income) {
    const ref = m.opcion.match(/#([0-9a-f]{6})\s*$/i)?.[1]?.toLowerCase()
    if (!ref) return { ok: false, message: '❌ Elige un proyecto de la lista' }
    const project = (await openProjects(studioId)).find((p) => p.id.startsWith(ref))
    if (!project) return { ok: false, message: '❌ Ese proyecto ya no tiene saldo pendiente' }
    if (monto > project.balance)
      return { ok: false, message: `❌ Supera el saldo pendiente (${cop(project.balance)})` }

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
  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return { ok: true, message: `✅ Salió ${cop(monto)} · ${personal ? 'Personal' : 'Negocio'} · ${category}` }
}
