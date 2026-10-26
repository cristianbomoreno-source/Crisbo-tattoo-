import { z } from 'zod'
import { cop } from '@/lib/projects/metrics'
import { parseBankSms } from '@/lib/expenses/sms'
import { movementOptions, saveMovement } from '@/lib/expenses/movement'
import { quickEntryAuthorized, quickEntryStudioId, quickEntryIssue, readShortcutBody, plainText as text } from '@/lib/expenses/quick-entry'

/** Automatización "Al recibir SMS de Nequi/Daviplata/Bold" del iPhone. El
 * atajo hace dos POST aquí con el texto del mensaje:
 *  1. `{ sms }` → respuesta vacía si no es un movimiento (login, pago rechazado,
 *     código…), o las opciones de "¿De qué?" por renglón. La primera es
 *     "No registrar · Entró $X por Banco": muestra el monto y sirve para
 *     plata entre cuentas propias.
 *  2. `{ sms, opcion }` → guarda con el monto y banco leídos del SMS. */
// Vacío: el atajo lo detecta con "Si Contenido de URL no tiene ningún valor"
// ("es" no aparece porque el iPhone toma la respuesta como archivo).
const IGNORE = ''
const SKIP_PREFIX = 'No registrar'

const schema = z.object({
  sms: z.string().trim().min(1, 'Falta el texto del mensaje'),
  opcion: z.string().trim().optional(),
})

export async function POST(req: Request) {
  if (!quickEntryAuthorized(req)) return text('❌ Token inválido', 401)
  const studioId = quickEntryStudioId()
  if (!studioId) return text('❌ Falta configurar el estudio', 500)

  const parsed = schema.safeParse(await readShortcutBody(req))
  if (!parsed.success) return text(quickEntryIssue(parsed.error.issues[0]), 400)
  const { sms, opcion } = parsed.data

  const movement = parseBankSms(sms)
  // TEMP diagnóstico del atajo: qué texto manda el iPhone (sin el monto completo).
  console.log('[movimiento/sms] in', JSON.stringify(sms.slice(0, 160)), movement ? 'parsed' : 'ignored')
  if (!movement) return text(IGNORE)

  if (!opcion) {
    try {
      const summary = `${SKIP_PREFIX} · ${movement.income ? 'Entró' : 'Salió'} ${cop(movement.amount)} por ${movement.medio}`
      return text([summary, ...(await movementOptions(studioId, movement.income))].join('\n'))
    } catch (e) {
      console.error('[movimiento/sms]', (e as Error).message)
      return text('❌ No se pudieron cargar las opciones', 500)
    }
  }

  if (opcion.startsWith(SKIP_PREFIX)) return text(`👌 No se registró ${cop(movement.amount)}`)

  const res = await saveMovement(studioId, {
    income: movement.income,
    monto: movement.amount,
    opcion,
    medio: movement.medio,
    nota: movement.comercio,
  })
  return text(res.message, res.ok ? 200 : 400)
}
