import {
  BALANCE_PREFIX,
  isBalanceSnapshot,
  isOtherIncome,
  isPersonalExpense,
  stripPersonalPrefix,
} from '@/lib/expenses/scope'

/**
 * Resumen de caja de Inicio (deslizar ← en el móvil, ver `cash-summary-sheet.tsx`).
 *
 * Sin tablas nuevas, con las convenciones que ya usan los atajos del iPhone
 * (`lib/expenses/movement.ts`):
 * - Cuenta de un cobro = `payments.payment_method`.
 * - Cuenta de un gasto / ingreso suelto = primer tramo de `description`
 *   ("Nequi · nota") cuando coincide con una cuenta conocida.
 * - Saldo real de una cuenta = fila "Saldo · Nequi" con el monto y, en la
 *   descripción, el instante en que se contó. Desde ese corte el saldo suma
 *   y resta solo lo registrado después. También crea cuentas nuevas.
 * - Gasto fijo = fila de `expenses` con `due_day`: es solo la DEFINICIÓN
 *   (nombre, monto, cuándo, cuenta habitual en la descripción) y se repite
 *   desde su `expense_date`. No es plata que salió. Por defecto es una vez al
 *   mes el día `due_day`; un tramo "Días 5, 20" en la descripción lo hace
 *   varias veces al mes y "Cada domingo", cada semana. Cada pago es una fila
 *   normal de la misma categoría y descripción "… · Pago fijo"
 *   (`payFixedExpenseAction`) — esa sí cuenta como gasto; los pagos del mes
 *   van cubriendo las fechas del mes en orden.
 */
export const FIXED_PAYMENT_MARK = 'Pago fijo'
export const NO_ACCOUNT = 'Sin cuenta'
export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const

export type FixedSchedule = { kind: 'monthly'; days: number[] } | { kind: 'weekly'; weekday: number }

export type CashPayment = {
  amount: number
  paid_at: string | null
  payment_method: string | null
  created_at?: string | null
}
export type CashExpense = {
  id: string
  category: string
  description: string | null
  amount: number
  expense_date: string
  due_day: number | null
  created_at?: string | null
}

export type AccountBalance = {
  name: string
  /** Movimientos desde el último saldo escrito (o desde siempre). */
  income: number
  expenses: number
  balance: number
  /** Último saldo escrito a mano, si hay. */
  setAmount: number | null
  setAt: string | null
}

export type FixedItem = {
  id: string
  name: string
  amount: number
  dueDay: number
  schedule: FixedSchedule
  /** "Día 5", "Días 5 y 20", "Cada domingo". */
  scheduleLabel: string
  personal: boolean
  /** Próxima fecha a pagar (YYYY-MM-DD): la primera sin pagar de este mes, si no la del siguiente. */
  nextDate: string
  daysLeft: number
  /** Ya se pagaron todas las fechas de este mes. */
  paidThisMonth: boolean
  /** Tiene fechas de este mes sin pagar (va a "Próximos pagos"). */
  pending: boolean
  /** Fechas de este mes que faltan por pagar. */
  remaining: number
  /** Lo que cuesta en un mes (monto × veces del mes). */
  perMonth: number
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
  /** Fijos con fechas de este mes sin pagar, por fecha. */
  upcoming: FixedItem[]
  /** Todo lo que falta pagar este mes (cada fecha pendiente cuenta). */
  upcomingTotal: number
  monthExpenses: MonthExpense[]
}

const WEEKLY_RE = /^cada (domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado)$/i
const DAYS_RE = /^d[ií]as ([\d ,y]+)$/i

/** Cuándo se repite un gasto fijo (ver el comentario de arriba). */
export function parseSchedule(description: string | null, dueDay: number | null): FixedSchedule {
  for (const seg of (description ?? '').split(' · ').map((s) => s.trim())) {
    const w = WEEKLY_RE.exec(seg)
    if (w) {
      const name = w[1]!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      return { kind: 'weekly', weekday: WEEKDAYS.findIndex((d) => d.normalize('NFD').replace(/[̀-ͯ]/g, '') === name) }
    }
    const d = DAYS_RE.exec(seg)
    if (d) {
      const days = [...new Set(d[1]!.split(/[ ,y]+/).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 31))]
      if (days.length) return { kind: 'monthly', days: days.sort((a, b) => a - b) }
    }
  }
  return { kind: 'monthly', days: [dueDay ?? 1] }
}

/** Tramo de descripción que guarda el horario; null si es el mensual de un solo día (basta `due_day`). */
export function scheduleTag(s: FixedSchedule): string | null {
  if (s.kind === 'weekly') return `Cada ${WEEKDAYS[s.weekday]}`
  return s.days.length > 1 ? `Días ${s.days.join(', ')}` : null
}

export function scheduleLabel(s: FixedSchedule): string {
  if (s.kind === 'weekly') return `Cada ${WEEKDAYS[s.weekday]}`
  if (s.days.length === 1) return `Día ${s.days[0]}`
  return `Días ${s.days.slice(0, -1).join(', ')} y ${s.days.at(-1)}`
}

function splitAccount(description: string | null, accounts: string[]): { account: string | null; note: string | null } {
  if (!description) return { account: null, note: null }
  const [head, ...rest] = description.split(' · ')
  const match = accounts.find((a) => a.toLowerCase() === head!.trim().toLowerCase())
  if (!match) return { account: null, note: description }
  return { account: match, note: rest.join(' · ') || null }
}

const pad = (n: number) => String(n).padStart(2, '0')
const key = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** Fechas (YYYY-MM-DD) del mes en que toca el gasto fijo. */
function occurrences(s: FixedSchedule, year: number, month0: number): string[] {
  const last = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
  if (s.kind === 'weekly') {
    const out: string[] = []
    for (let d = 1; d <= last; d++) {
      const date = new Date(Date.UTC(year, month0, d))
      if (date.getUTCDay() === s.weekday) out.push(key(date))
    }
    return out
  }
  return [...new Set(s.days.map((d) => key(new Date(Date.UTC(year, month0, Math.min(d, last))))))].sort()
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / 86400000)
}

/** Instante para comparar con un corte de saldo (Date.parse; 0 si no hay). */
const at = (...candidates: (string | null | undefined)[]) => {
  for (const c of candidates) {
    const t = c ? Date.parse(c.length === 10 ? `${c}T00:00:00Z` : c) : NaN
    if (!Number.isNaN(t)) return t
  }
  return 0
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
  const addName = (n: string) => {
    if (n && !accountNames.some((a) => a.toLowerCase() === n.toLowerCase())) accountNames.push(n)
  }
  for (const p of payments) if (p.payment_method) addName(p.payment_method)

  // Último saldo escrito a mano por cuenta.
  const snapshots = new Map<string, { amount: number; at: number; iso: string }>()
  for (const e of expenses) {
    if (!isBalanceSnapshot(e.category)) continue
    const name = e.category.slice(BALANCE_PREFIX.length).trim()
    if (!name) continue
    addName(name)
    const t = at(e.description, e.created_at, e.expense_date)
    const k = name.toLowerCase()
    const prev = snapshots.get(k)
    if (!prev || t > prev.at) snapshots.set(k, { amount: e.amount, at: t, iso: new Date(t).toISOString() })
  }

  const byAccount = new Map<string, AccountBalance>()
  const bucket = (name: string | null) => {
    const k = name ?? NO_ACCOUNT
    let b = byAccount.get(k)
    if (!b) {
      const snap = name ? snapshots.get(name.toLowerCase()) : undefined
      byAccount.set(k, (b = { name: k, income: 0, expenses: 0, balance: 0, setAmount: snap?.amount ?? null, setAt: snap?.iso ?? null }))
    }
    return b
  }
  /** Ya estaba contado en el saldo escrito a mano de esa cuenta. */
  const beforeSnapshot = (account: string | null, t: number) => {
    const snap = account ? snapshots.get(account.toLowerCase()) : undefined
    return !!snap && t <= snap.at
  }
  const canonical = (m: string | null) => (m ? accountNames.find((a) => a.toLowerCase() === m.toLowerCase()) ?? m : null)

  const month = { income: 0, business: 0, personal: 0 }

  for (const p of payments) {
    const account = canonical(p.payment_method)
    if (p.paid_at?.slice(0, 7) === monthKey) month.income += p.amount
    if (!beforeSnapshot(account, at(p.created_at, p.paid_at))) bucket(account).income += p.amount
  }

  const monthExpenses: MonthExpense[] = []
  for (const e of expenses) {
    if (e.due_day !== null || isBalanceSnapshot(e.category)) continue // definición de un fijo o saldo: no es plata que se movió
    const { account, note } = splitAccount(e.description, accountNames)
    const inMonth = e.expense_date.slice(0, 7) === monthKey
    const counted = !beforeSnapshot(account, at(e.created_at, e.expense_date))
    if (isOtherIncome(e.category)) {
      if (counted) bucket(account).income += e.amount
      if (inMonth) month.income += e.amount
      continue
    }
    if (counted) bucket(account).expenses += e.amount
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

  for (const n of accountNames) bucket(n)
  for (const b of byAccount.values()) b.balance = (b.setAmount ?? 0) + b.income - b.expenses
  // Cuentas conocidas primero (aunque estén en cero), "Sin cuenta" al final.
  const accounts = [
    ...accountNames.map((n) => byAccount.get(n)!),
    ...[...byAccount.values()].filter((b) => b.name !== NO_ACCOUNT && !accountNames.includes(b.name)),
    ...(byAccount.has(NO_ACCOUNT) ? [byAccount.get(NO_ACCOUNT)!] : []),
  ]

  const [y, m] = monthKey.split('-').map(Number) as [number, number]
  const fixed: FixedItem[] = expenses
    .filter((e) => e.due_day !== null && e.due_day >= 1 && e.due_day <= 31 && !isOtherIncome(e.category) && !isBalanceSnapshot(e.category))
    .map((e) => {
      const schedule = parseSchedule(e.description, e.due_day)
      // Solo cuentan las fechas desde que se creó (creado el 21 con día 20: arranca el mes siguiente).
      const thisMonth = occurrences(schedule, y, m - 1).filter((d) => d >= e.expense_date)
      const paidCount = expenses.filter(
        (x) =>
          x.id !== e.id &&
          x.due_day === null &&
          x.category === e.category &&
          x.expense_date.slice(0, 7) === monthKey &&
          (x.description ?? '').includes(FIXED_PAYMENT_MARK)
      ).length
      const unpaid = thisMonth.slice(paidCount)
      const pending = unpaid.length > 0
      const nextDate = pending ? unpaid[0]! : occurrences(schedule, y, m)[0]!
      return {
        id: e.id,
        name: stripPersonalPrefix(e.category),
        amount: e.amount,
        dueDay: e.due_day!,
        schedule,
        scheduleLabel: scheduleLabel(schedule),
        personal: isPersonalExpense(e.category),
        nextDate,
        daysLeft: daysBetween(today, nextDate),
        paidThisMonth: thisMonth.length > 0 && !pending,
        pending,
        remaining: unpaid.length,
        perMonth: e.amount * occurrences(schedule, y, m - 1).length,
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
    upcomingTotal: upcoming.reduce((s, f) => s + f.amount * f.remaining, 0),
    monthExpenses: monthExpenses.sort((a, b) => b.date.localeCompare(a.date)),
  }
}
