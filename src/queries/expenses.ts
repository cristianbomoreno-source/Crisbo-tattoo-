import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import type { CashPayment, CashExpense } from '@/lib/finance/cash-summary'

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

/** Todas las filas, de a 1.000 (tope de Supabase por consulta). */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...(data ?? []))
    if (!data || data.length < 1000) return out
  }
}

/** Datos crudos del "Resumen de caja" de Inicio (ver lib/finance/cash-summary.ts):
 * todos los cobros y gastos del estudio, sin filtro de fecha — el saldo por
 * cuenta es acumulado. RLS limita a los del estudio. */
export async function getCashData(): Promise<
  Result<{ payments: CashPayment[]; expenses: CashExpense[] }>
> {
  const supabase = await createClient()
  try {
    const [payments, expenses] = await Promise.all([
      fetchAll<CashPayment>((from, to) =>
        supabase.from('payments').select('amount, paid_at, payment_method').order('paid_at').range(from, to)
      ),
      fetchAll<CashExpense>((from, to) =>
        supabase
          .from('expenses')
          .select('id, category, description, amount, expense_date, due_day')
          .order('expense_date')
          .range(from, to)
      ),
    ])
    return ok({ payments, expenses })
  } catch (e) {
    return dbError({ message: (e as Error).message })
  }
}
