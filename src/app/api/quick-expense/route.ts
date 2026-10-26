import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { todayKey } from '@/lib/calendar/utils'
import { cop } from '@/lib/projects/metrics'
import { personalCategory } from '@/lib/expenses/scope'
import { quickEntryAuthorized, quickEntryStudioId, quickEntryIssue, readShortcutBody, plainText as text } from '@/lib/expenses/quick-entry'

/** Registro rápido de gastos desde el atajo del iPhone ("Gasto Crisbo"):
 * Tocar atrás ×2 o al cerrar Nequi/Daviplata/Nu → el atajo pide monto,
 * negocio/personal, categoría y nota y hace POST aquí con
 * `Authorization: Bearer QUICK_EXPENSE_TOKEN`. Se guarda en el estudio
 * QUICK_EXPENSE_STUDIO_ID. Responde texto plano para que el atajo lo muestre. */
const schema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  tipo: z.string().trim().toLowerCase().pipe(z.enum(['negocio', 'personal'])),
  categoria: z.string().trim().min(1, 'Falta la categoría').max(28),
  nota: z.string().trim().max(200).optional(),
})

export async function POST(req: Request) {
  if (!quickEntryAuthorized(req)) return text('❌ Token inválido', 401)
  const studioId = quickEntryStudioId()
  if (!studioId) return text('❌ Falta configurar el estudio', 500)

  const parsed = schema.safeParse(await readShortcutBody(req))
  if (!parsed.success) return text(quickEntryIssue(parsed.error.issues[0]), 400)

  const { monto, tipo, categoria, nota } = parsed.data
  const { error } = await createAdminClient()
    .from('expenses')
    .insert({
      studio_id: studioId,
      category: tipo === 'personal' ? personalCategory(categoria) : categoria,
      description: nota || null,
      amount: Math.round(monto),
      expense_date: todayKey(),
    })
  if (error) {
    console.error('[quick-expense]', error.message)
    return text('❌ No se pudo guardar, intenta de nuevo', 500)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return text(`✅ ${cop(Math.round(monto))} · ${tipo === 'personal' ? 'Personal' : 'Negocio'} · ${categoria}`)
}
