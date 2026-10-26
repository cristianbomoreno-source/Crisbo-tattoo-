import { z } from 'zod'
import { movementOptions, saveMovement } from '@/lib/expenses/movement'
import { quickEntryAuthorized, quickEntryStudioId, quickEntryIssue, readShortcutBody, plainText as text } from '@/lib/expenses/quick-entry'

/** Atajo "Caja Crisbo" del iPhone: un solo flujo lineal (sin bloques "Si")
 * para registrar plata que entró o salió.
 *  1. Elige "Ingreso" / "Gasto" (o "Entró"/"Salió") y escribe el monto.
 *  2. GET ?movimiento=… devuelve las opciones, una por renglón:
 *     - Salió: "Negocio · Insumos", "Personal · Comida", …
 *     - Entró: "Otro cliente (escribe su nombre en la nota)" — busca entre
 *       todos los clientes —, "Abono de cita nueva", "Venta de producto", "Otro ingreso"
 *       y los proyectos con saldo, "Cliente · Proyecto · debe $X · #abc123"
 *  3. Elige opción, medio (Nequi, Bold, …) y nota → POST aquí.
 * Cómo se guarda cada cosa: lib/expenses/movement.ts. */

// El atajo puede mandar "✅ Ingreso" y el iPhone a veces corta el enlace en
// el espacio, así que solo llega el ✅: también cuenta como ingreso.
const isIncome = (movimiento: string) => /entr|ingres|✅/i.test(movimiento)

export async function GET(req: Request) {
  if (!quickEntryAuthorized(req)) return text('❌ Token inválido', 401)
  const studioId = quickEntryStudioId()
  if (!studioId) return text('❌ Falta configurar el estudio', 500)

  const movimiento = new URL(req.url).searchParams.get('movimiento') ?? ''
  try {
    return text((await movementOptions(studioId, isIncome(movimiento))).join('\n'))
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
  const { movimiento, monto, opcion, medio, nota } = parsed.data

  const res = await saveMovement(studioId, {
    income: isIncome(movimiento),
    monto,
    opcion,
    medio: medio || null,
    nota: nota && nota !== '-' ? nota : null,
  })
  return text(res.message, res.ok ? 200 : 400)
}
