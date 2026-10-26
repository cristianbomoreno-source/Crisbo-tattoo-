import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { todayKey } from '@/lib/calendar/utils'
import { parseSchedule, parseUntil, type CashPayment, type CashExpense } from '@/lib/finance/cash-summary'
import { LEDGER_ONLY_PREFIXES, isOtherIncome } from '@/lib/expenses/scope'

export type Expense = {
  id: string
  category: string
  description: string | null
  amount: number
  expense_date: string
  due_day: number | null
  created_at: string
}

/** Gastos reales (plata que salió). Las filas con `due_day` son la
 * DEFINICIÓN de un gasto fijo mensual (se repite cada mes en su día), no un
 * gasto: se excluyen salvo `includeFixed` (Ajustes → Gastos las lista para
 * poder borrarlas). El pago de cada mes es una fila normal "… · Pago fijo". */
export async function getExpenses(from?: string, to?: string, { includeFixed = false } = {}): Promise<Result<Expense[]>> {
  const supabase = await createClient()
  let query = supabase
    .from('expenses')
    .select('id, category, description, amount, expense_date, due_day, created_at')
    .order('expense_date', { ascending: false })
  // Saldos, entradas, salidas sin clasificar y traslados del libro de cada
  // cuenta (Resumen de caja): mueven plata pero no son gastos.
  for (const prefix of LEDGER_ONLY_PREFIXES) query = query.not('category', 'like', `${prefix}%`)

  if (!includeFixed) query = query.is('due_day', null)
  if (from) query = query.gte('expense_date', from)
  if (to) query = query.lte('expense_date', to)

  const { data, error } = await query
  if (error) return dbError(error)
  return ok(data as Expense[])
}

/** Gastos fijos mensuales (con día de vencimiento) - usados para alertas.
 * Los semanales ("Cada domingo") se quedan en el Resumen de caja y los de
 * cuotas ya terminadas ("Hasta 2027-01") no avisan más. */
export async function getFixedExpenses(): Promise<Result<Expense[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('id, category, description, amount, expense_date, due_day, created_at')
    .not('due_day', 'is', null)
    .order('due_day', { ascending: true })

  if (error) return dbError(error)
  const month = todayKey().slice(0, 7)
  return ok(
    (data as Expense[]).filter((e) => {
      const until = parseUntil(e.description)
      return parseSchedule(e.description, e.due_day).kind === 'monthly' && (!until || month <= until) && !isOtherIncome(e.category)
    }),
  )
}

/** Todas las filas, de a 1.000 (tope de Supabase por consulta). */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
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
export async function getCashData(): Promise<Result<{ payments: CashPayment[]; expenses: CashExpense[] }>> {
  const supabase = await createClient()
  try {
    const [payments, expenses] = await Promise.all([
      // Los tipos generados ven el join como arreglo; en runtime es un objeto.
      fetchAll<CashPayment>(
        (from, to) =>
          supabase
            .from('payments')
            .select('id, amount, paid_at, payment_method, created_at, projects(name, clients(name))')
            .order('paid_at')
            .range(from, to) as unknown as PromiseLike<{ data: CashPayment[] | null; error: { message: string } | null }>,
      ),
      fetchAll<CashExpense>((from, to) =>
        supabase
          .from('expenses')
          .select('id, category, description, amount, expense_date, due_day, created_at')
          .order('expense_date')
          .range(from, to),
      ),
    ])
    return ok({ payments, expenses })
  } catch (e) {
    return dbError({ message: (e as Error).message })
  }
}
