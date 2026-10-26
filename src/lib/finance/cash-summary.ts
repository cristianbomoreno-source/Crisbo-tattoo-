import { isOtherIncome, isPersonalExpense, stripPersonalPrefix } from '@/lib/expenses/scope'

/**
 * Resumen de caja de Inicio (deslizar ← en el móvil, ver `cash-summary-sheet.tsx`).
 *
 * Sin tablas nuevas, con las convenciones que ya usan los atajos del iPhone
 * (`lib/expenses/movement.ts`):
 * - Cuenta de un cobro = `payments.payment_method`.
 * - Cuenta de un gasto / ingreso suelto = primer tramo de `description`
 *   ("Nequi · nota") cuando coincide con una cuenta conocida.
 * - Gasto fijo = fila de `expenses` con `due_day`: es solo la DEFINICIÓN
 *   (nombre, monto, día, cuenta habitual en la descripción) y se repite cada
 *   mes desde su `expense_date`. No es plata que salió. Cada mes se marca
 *   pagado con una fila normal de la misma categoría y descripción
 *   "… · Pago fijo" (`payFixedExpenseAction`) — esa sí cuenta como gasto.
 */
export const FIXED_PAYMENT_MARK = 'Pago fijo'
export const NO_ACCOUNT = 'Sin cuenta'

export type CashPayment = { amount: number; paid_at: string | null; payment_method: string | null }
export type CashExpense = {
  id: string
  category: string
  description: string | null
  amount: number
  expense_date: string
  due_day: number | null
}

export type AccountBalance = { name: string; income: number; expenses: number; balance: number }

export type FixedItem = {
  id: string
  name: string
  amount: number
  dueDay: number
  personal: boolean
  /** Próxima fecha a pagar (YYYY-MM-DD): este mes si no está pagado, si no el siguiente. */
  nextDate: string
  daysLeft: number
  paidThisMonth: boolean
  /** Le toca este mes y no está pagado (va a "Próximos pagos"). */
  pending: boolean
  /** Cuenta de donde suele salir (primer tramo de la descripción), si tiene. */
  account: string | null
}

export type MonthExpense = {
  id: string
  name: string
  personal: boolean
  amount: number
  date: string
  account: string | null
  note: string | null
}

export type CashSummary = {
  accounts: AccountBalance[]
  total: number
  month: { income: number; business: number; personal: number }
  fixedBusiness: FixedItem[]
  fixedPersonal: FixedItem[]
  /** Fijos que tocan este mes y no están pagados, por fecha. */
  upcoming: FixedItem[]
  upcomingTotal: number
  monthExpenses: MonthExpense[]
}

function splitAccount(description: string | null, accounts: string[]): { account: string | null; note: string | null } {
  if (!description) return { account: null, note: null }
  const [head, ...rest] = description.split(' · ')
  const match = accounts.find((a) => a.toLowerCase() === head!.trim().toLowerCase())
  if (!match) return { account: null, note: description }
  return { account: match, note: rest.join(' · ') || null }
}

const pad = (n: number) => String(n).padStart(2, '0')

function dueDateIn(year: number, month0: number, dueDay: number): string {
  const last = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
  const d = new Date(Date.UTC(year, month0, Math.min(dueDay, last)))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / 86400000)
}

export function cashSummary({
  payments,
  expenses,
  accounts: knownAccounts,
  today,
}: {
  payments: CashPayment[]
  expenses: CashExpense[]
  /** Métodos de pago del estudio (o los sugeridos). */
  accounts: string[]
  /** YYYY-MM-DD en hora de Bogotá. */
  today: string
}): CashSummary {
  const monthKey = today.slice(0, 7)
  const accountNames = [...knownAccounts]
  for (const p of payments) {
    if (p.payment_method && !accountNames.some((a) => a.toLowerCase() === p.payment_method!.toLowerCase())) {
      accountNames.push(p.payment_method)
    }
  }

  const byAccount = new Map<string, AccountBalance>()
  const bucket = (name: string | null) => {
    const key = name ?? NO_ACCOUNT
    let b = byAccount.get(key)
    if (!b) byAccount.set(key, (b = { name: key, income: 0, expenses: 0, balance: 0 }))
    return b
  }
  const canonical = (m: string | null) => (m ? accountNames.find((a) => a.toLowerCase() === m.toLowerCase()) ?? m : null)

  const month = { income: 0, business: 0, personal: 0 }

  for (const p of payments) {
    bucket(canonical(p.payment_method)).income += p.amount
    if (p.paid_at?.slice(0, 7) === monthKey) month.income += p.amount
  }

  const monthExpenses: MonthExpense[] = []
  for (const e of expenses) {
    if (e.due_day !== null) continue // definición de un fijo, no plata que salió
    const { account, note } = splitAccount(e.description, accountNames)
    const inMonth = e.expense_date.slice(0, 7) === monthKey
    if (isOtherIncome(e.category)) {
      bucket(account).income += e.amount
      if (inMonth) month.income += e.amount
      continue
    }
    bucket(account).expenses += e.amount
    const personal = isPersonalExpense(e.category)
    if (inMonth) {
      if (personal) month.personal += e.amount
      else month.business += e.amount
      monthExpenses.push({
        id: e.id,
        name: stripPersonalPrefix(e.category),
        personal,
        amount: e.amount,
        date: e.expense_date,
        account,
        note,
      })
    }
  }

  for (const b of byAccount.values()) b.balance = b.income - b.expenses
  // Cuentas conocidas primero (aunque estén en cero), "Sin cuenta" al final.
  const accounts = [
    ...accountNames.map((n) => byAccount.get(n) ?? { name: n, income: 0, expenses: 0, balance: 0 }),
    ...[...byAccount.values()].filter((b) => b.name !== NO_ACCOUNT && !accountNames.includes(b.name)),
    ...(byAccount.has(NO_ACCOUNT) ? [byAccount.get(NO_ACCOUNT)!] : []),
  ]

  const [y, m] = monthKey.split('-').map(Number) as [number, number]
  const fixed: FixedItem[] = expenses
    .filter((e) => e.due_day !== null && e.due_day >= 1 && e.due_day <= 31 && !isOtherIncome(e.category))
    .map((e) => {
      const thisMonthDate = dueDateIn(y, m - 1, e.due_day!)
      // Creado después de la fecha de este mes: arranca el mes siguiente.
      const startsNextMonth = e.expense_date > thisMonthDate
      const paidThisMonth = expenses.some(
          (x) =>
            x.id !== e.id &&
            x.due_day === null &&
            x.category === e.category &&
            x.expense_date.slice(0, 7) === monthKey &&
            (x.description ?? '').includes(FIXED_PAYMENT_MARK)
        )
      const pending = !paidThisMonth && !startsNextMonth
      const nextDate = pending ? thisMonthDate : dueDateIn(y, m, e.due_day!)
      return {
        id: e.id,
        name: stripPersonalPrefix(e.category),
        amount: e.amount,
        dueDay: e.due_day!,
        personal: isPersonalExpense(e.category),
        nextDate,
        daysLeft: daysBetween(today, nextDate),
        paidThisMonth,
        pending,
        account: splitAccount(e.description, accountNames).account,
      }
    })
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))

  const upcoming = fixed.filter((f) => f.pending)

  return {
    accounts,
    total: accounts.reduce((s, a) => s + a.balance, 0),
    month,
    fixedBusiness: fixed.filter((f) => !f.personal),
    fixedPersonal: fixed.filter((f) => f.personal),
    upcoming,
    upcomingTotal: upcoming.reduce((s, f) => s + f.amount, 0),
    monthExpenses: monthExpenses.sort((a, b) => b.date.localeCompare(a.date)),
  }
}
