'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { createExpenseSchema } from '@/lib/validations/expenses'
import { revalidatePath } from 'next/cache'
import { todayKey } from '@/lib/calendar/utils'
import { FIXED_PAYMENT_MARK } from '@/lib/finance/cash-summary'

async function getArtistAndStudio() {
  const supabase = await createClient()
  const { data } = await supabase.from('artists').select('id, studio_id').single()
  return data
}

/** Crea un gasto. La categoría es texto libre — el tatuador escribe la que
 * quiera, no hay catálogo fijo que mantener. */
export async function createExpenseAction(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = createExpenseSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .insert({ studio_id: artist.studio_id, ...parsed.data })
    .select('id')
    .single()
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return ok({ id: data.id })
}

export async function deleteExpenseAction(id: string): Promise<Result<void>> {
  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return ok(undefined)
}

/** "Marcar pagado" de un gasto fijo desde el Resumen de caja de Inicio: crea
 * el gasto del mes (misma categoría y monto, sin `due_day`) con la cuenta de
 * donde salió la plata — ver `FIXED_PAYMENT_MARK` en lib/finance/cash-summary.ts. */
export async function payFixedExpenseAction(id: string, account?: string | null): Promise<Result<void>> {
  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { data: fixed, error: readError } = await supabase
    .from('expenses')
    .select('category, amount, due_day')
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
    .single()
  if (readError || !fixed?.due_day) return err('NOT_FOUND', 'Gasto fijo no encontrado')

  const { error } = await supabase.from('expenses').insert({
    studio_id: artist.studio_id,
    category: fixed.category,
    amount: fixed.amount,
    expense_date: todayKey(),
    description: [account?.trim().slice(0, 40), FIXED_PAYMENT_MARK].filter(Boolean).join(' · '),
  })
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return ok(undefined)
}
