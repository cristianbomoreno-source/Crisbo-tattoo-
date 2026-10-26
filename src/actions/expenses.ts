'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { createExpenseSchema } from '@/lib/validations/expenses'
import { revalidatePath } from 'next/cache'
import { todayKey } from '@/lib/calendar/utils'
import { FIXED_PAYMENT_MARK, discountFor } from '@/lib/finance/cash-summary'
import { BALANCE_PREFIX } from '@/lib/expenses/scope'

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
  const { error } = await supabase.from('expenses').delete().eq('studio_id', artist.studio_id).eq('id', id)
  if (error) return dbError(error)

  revalidatePath('/dashboard')
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
    .select('category, amount, due_day, description')
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
    .single()
  if (readError || !fixed?.due_day) return err('NOT_FOUND', 'Gasto fijo no encontrado')

  // Con descuento este mes se paga menos (tramo "Descuento AAAA-MM monto").
  const discount = Math.min(discountFor(fixed.description, todayKey().slice(0, 7)), fixed.amount)
  const { error } = await supabase.from('expenses').insert({
    studio_id: artist.studio_id,
    category: fixed.category,
    amount: fixed.amount - discount,
    expense_date: todayKey(),
    description: [account?.trim().slice(0, 40), FIXED_PAYMENT_MARK].filter(Boolean).join(' · '),
  })
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return ok(undefined)
}

/** "¿Cuánto hay?" de una tarjeta de cuenta en el Resumen de caja: guarda el
 * saldo real como corte ("Saldo · Nequi", con el instante en la descripción).
 * Desde ahí el saldo de esa cuenta sigue con lo que se registre después.
 * Con un nombre nuevo, crea la cuenta. */
export async function setAccountBalanceAction(account: string, amount: number): Promise<Result<void>> {
  const name = account
    .trim()
    .replace(/\s*·\s*/g, ' ')
    .slice(0, 40 - BALANCE_PREFIX.length)
  if (!name) return err('VALIDATION_ERROR', 'Escribe el nombre de la cuenta')
  if (!Number.isFinite(amount) || amount < 0) return err('VALIDATION_ERROR', 'El saldo no puede ser negativo')

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { error } = await supabase.from('expenses').insert({
    studio_id: artist.studio_id,
    category: `${BALANCE_PREFIX}${name}`,
    amount: Math.round(amount),
    expense_date: todayKey(),
    description: new Date().toISOString(),
  })
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  return ok(undefined)
}

/** Cambia qué es un movimiento del libro de una cuenta (Resumen de caja):
 * gasto personal / del negocio / sin clasificar, venta suelta / entrada que
 * no es venta, o traslado a otra cuenta propia. Solo toca la categoría y,
 * en un traslado, la descripción (cuenta de origen primero). */
export async function reclassifyExpenseAction(id: string, category: string, description?: string | null): Promise<Result<void>> {
  const cat = category.trim().slice(0, 40)
  if (!cat) return err('VALIDATION_ERROR', 'Falta la categoría')

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ category: cat, ...(description !== undefined ? { description: description?.slice(0, 200) ?? null } : {}) })
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/gastos')
  revalidatePath('/dashboard/settings/finanzas')
  return ok(undefined)
}

/** Descuento de un gasto fijo solo para este mes (p. ej. el arriendo del
 * local con $260.000 menos): se guarda como tramo "Descuento AAAA-MM monto"
 * en su descripción; con 0 se quita el de este mes. */
export async function setFixedDiscountAction(id: string, amount: number): Promise<Result<void>> {
  if (!Number.isFinite(amount) || amount < 0) return err('VALIDATION_ERROR', 'El descuento no puede ser negativo')
  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { data: fixed, error: readError } = await supabase
    .from('expenses')
    .select('description, amount, due_day')
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
    .single()
  if (readError || !fixed?.due_day) return err('NOT_FOUND', 'Gasto fijo no encontrado')
  if (amount > fixed.amount) return err('VALIDATION_ERROR', 'El descuento no puede ser mayor que el monto')

  const month = todayKey().slice(0, 7)
  const segments = (fixed.description ?? '')
    .split(' · ')
    .filter((s: string) => s.trim() && !s.trim().toLowerCase().startsWith(`descuento ${month}`))
  if (amount > 0) segments.push(`Descuento ${month} ${Math.round(amount)}`)
  const { error } = await supabase
    .from('expenses')
    .update({ description: segments.join(' · ').slice(0, 200) || null })
    .eq('studio_id', artist.studio_id)
    .eq('id', id)
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  return ok(undefined)
}
