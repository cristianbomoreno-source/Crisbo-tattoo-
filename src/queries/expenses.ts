import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type Expense = {
  id: string
  category: string
  description: string | null
  amount: number
  expense_date: string
  due_day: number | null
  created_at: string
}

export async function getExpenses(from?: string, to?: string): Promise<Result<Expense[]>> {
  const supabase = await createClient()
  let query = supabase
    .from('expenses')
    .select('id, category, description, amount, expense_date, due_day, created_at')
    .order('expense_date', { ascending: false })

  if (from) query = query.gte('expense_date', from)
  if (to) query = query.lte('expense_date', to)

  const { data, error } = await query
  if (error) return dbError(error)
  return ok(data as Expense[])
}

/** Gastos fijos (con día de vencimiento definido) - usados para alertas */
export async function getFixedExpenses(): Promise<Result<Expense[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('id, category, description, amount, expense_date, due_day, created_at')
    .not('due_day', 'is', null)
    .order('due_day', { ascending: true })

  if (error) return dbError(error)
  return ok(data as Expense[])
}
