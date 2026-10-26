import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { todayKey } from '@/lib/calendar/utils'
import { cop } from '@/lib/projects/metrics'
import { personalCategory } from '@/lib/expenses/scope'
import { quickEntryAuthorized, quickEntryStudioId, quickEntryIssue, readShortcutBody, plainText as text } from '@/lib/expenses/quick-entry'

/** Atajo "Caja Crisbo" del iPhone: un solo flujo lineal (sin bloques "Si")
 * para registrar plata que entró o salió.
 *  1. Elige "Ingreso" / "Gasto" (o "Entró"/"Salió") y escribe el monto.
 *  2. GET ?movimiento=… devuelve las opciones, una por renglón:
 *     - Salió: "Negocio · Insumos", "Personal · Comida", …
 *     - Entró: proyectos con saldo, "Cliente · Proyecto · debe $X · #abc123"
 *  3. Elige opción, medio (Nequi, Bold, …) y nota → POST aquí.
 * Gastos → `expenses` (personales con prefijo, ver lib/expenses/scope.ts);
 * ingresos → `payments` del proyecto elegido, igual que la Caja de Inicio. */
const BUSINESS = ['Insumos', 'Arriendo', 'Servicios', 'Publicidad', 'Transporte', 'Equipo', 'Otro']
const PERSONAL = ['Comida', 'Transporte', 'Hogar', 'Salud', 'Ocio', 'Deudas', 'Otro']

// El atajo puede mandar "✅ Ingreso" y el iPhone a veces corta el enlace en
// el espacio, así que solo llega el ✅: también cuenta como ingreso.
const isIncome = (movimiento: string) => /entr|ingres|✅/i.test(movimiento)

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

export async function GET(req: Request) {
  if (!quickEntryAuthorized(req)) return text('❌ Token inválido', 401)
  const studioId = quickEntryStudioId()
  if (!studioId) return text('❌ Falta configurar el estudio', 500)

  const movimiento = new URL(req.url).searchParams.get('movimiento') ?? ''
  if (!isIncome(movimiento)) {
    return text([...BUSINESS.map((c) => `Negocio · ${c}`), ...PERSONAL.map((c) => `Personal · ${c}`)].join('\n'))
  }
  try {
    const projects = await openProjects(studioId)
    if (projects.length === 0) return text('No hay proyectos con saldo pendiente')
    return text(projects.slice(0, 40).map(projectLine).join('\n'))
  } catch (e) {
    console.error('[movimiento]', (e as Error).message)
    return text('❌ No se pudieron cargar los proyectos', 500)
  }
}

const schema = z.object({
  movimiento: z.string().trim().min(1, 'Falta si entró o salió'),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  opcion: z.string().trim().min(1, 'Falta la opción'),
  medio: z.string().trim().max(40).optional(),
  nota: z.string().trim().max(200).optional(),
})

export async function POST(req: Request) {
  if (!quickEntryAuthorized(req)) return text('❌ Token inválido', 401)
  const studioId = quickEntryStudioId()
  if (!studioId) return text('❌ Falta configurar el estudio', 500)

  const parsed = schema.safeParse(await readShortcutBody(req))
  if (!parsed.success) return text(quickEntryIssue(parsed.error.issues[0]), 400)
  const { movimiento, opcion, medio, nota } = parsed.data
  const monto = Math.round(parsed.data.monto)
  const cleanNota = nota && nota !== '-' ? nota : null
  const supabase = createAdminClient()

  if (isIncome(movimiento)) {
    const ref = opcion.match(/#([0-9a-f]{6})\s*$/i)?.[1]?.toLowerCase()
    if (!ref) return text('❌ Elige un proyecto de la lista', 400)
    const project = (await openProjects(studioId)).find((p) => p.id.startsWith(ref))
    if (!project) return text('❌ Ese proyecto ya no tiene saldo pendiente', 400)
    if (monto > project.balance) return text(`❌ Supera el saldo pendiente (${cop(project.balance)})`, 400)

    const { error } = await supabase.from('payments').insert({
      studio_id: studioId,
      project_id: project.id,
      amount: monto,
      payment_method: medio || null,
      notes: cleanNota,
    })
    if (error) {
      console.error('[movimiento] payment', error.message)
      return text('❌ No se pudo guardar, intenta de nuevo', 500)
    }
    revalidatePath(`/dashboard/projects/${project.id}`)
    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings/finanzas')
    const left = project.balance - monto
    const who = project.clients?.name ?? project.name
    return text(`✅ Entró ${cop(monto)} · ${who}${left > 0 ? ` · queda ${cop(left)}` : ' · ¡pagado completo!'}`)
  }

  const [scope, ...rest] = opcion.split(' · ')
  const category = rest.join(' · ').trim() || opcion
  const personal = /personal/i.test(scope ?? '')
  const { error } = await supabase.from('expenses').insert({
    studio_id: studioId,
    category: personal ? personalCategory(category) : category.slice(0, 40),
    description: [medio, cleanNota].filter(Boolean).join(' · ') || null,
    amount: monto,
    expense_date: todayKey(),
  })
  if (error) {
    console.error('[movimiento] expense', error.message)
    return text('❌ No se pudo guardar, intenta de nuevo', 500)
  }
  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return text(`✅ Salió ${cop(monto)} · ${personal ? 'Personal' : 'Negocio'} · ${category}`)
}
