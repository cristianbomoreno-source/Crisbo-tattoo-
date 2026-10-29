import {
  BALANCE_PREFIX,
  MOVE_IN_PREFIX,
  MOVE_OUT_PREFIX,
  TRANSFER_PREFIX,
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
 * - Saldo de una cuenta = fila "Saldo · Nequi" con el monto y, en la
 *   descripción, el instante del corte (saldo inicial). Desde ese corte el
 *   saldo suma y resta solo lo registrado después. También crea cuentas.
 * - Movimientos que no son venta ni gasto, para que el libro de la cuenta
 *   cuadre con el extracto del banco: "Entrada · Cadena" (entró, no es
 *   venta), "Salida · A 3202107769" (salió, sin clasificar) y
 *   "Transferencia · Efectivo" (de la cuenta de la descripción a otra propia).
 * - Gasto fijo = fila de `expenses` con `due_day`: es solo la DEFINICIÓN
 *   (nombre, monto, cuándo, cuenta habitual en la descripción) y se repite
 *   desde su `expense_date`. No es plata que salió. Por defecto es una vez al
 *   mes el día `due_day`; un tramo "Días 5, 20" en la descripción lo hace
 *   varias veces al mes y "Cada domingo", cada semana. Cada pago es una fila
 *   normal de la misma categoría y descripción "… · Pago fijo"
 *   (`payFixedExpenseAction`) — esa sí cuenta como gasto; los pagos del mes
 *   van cubriendo las fechas del mes en orden. Un tramo "Descuento 2026-10
 *   260000" baja lo que toca pagar ese mes. Con categoría "Ingreso · …" es un
 *   ingreso fijo (lo que te pagan cada mes, p. ej. el arriendo de un tatuador):
 *   se marca recibido igual y ese pago cuenta como ingreso.
 */
export const FIXED_PAYMENT_MARK = 'Pago fijo'
export const NO_ACCOUNT = 'Sin cuenta'
export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const

export type FixedSchedule = { kind: 'monthly'; days: number[] } | { kind: 'weekly'; weekday: number }

export type CashPayment = {
  id?: string
  amount: number
  paid_at: string | null
  payment_method: string | null
  created_at?: string | null
  projects?: { name: string | null; clients: { name: string | null } | null } | null
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
  /** Traslados a otras cuentas propias (salen) y desde ellas (entran). */
  transfersOut: number
  transfersIn: number
  balance: number
  /** Último saldo escrito a mano (saldo inicial del libro), si hay. */
  setAmount: number | null
  setAt: string | null
}

export type LedgerKind = 'income' | 'expense' | 'transfer-out' | 'transfer-in'

/** Un renglón del libro de una cuenta. */
export type LedgerEntry = {
  /** `p:<id>` cobro, `e:<id>` fila de expenses (una transferencia sale en las dos cuentas). */
  key: string
  expenseId: string | null
  /** Cobro a un cliente (tabla payments): se puede borrar para reversar el ingreso. */
  paymentId: string | null
  date: string
  name: string
  kind: LedgerKind
  amount: number
  /** "Venta", "Ingreso", "Entrada", "Personal", "Negocio", "Sin clasificar" o "Transferencia". */
  tipo: string
  account: string
  /** La otra cuenta de una transferencia. */
  otherAccount: string | null
  note: string | null
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
  /** Ingreso fijo (te pagan a ti), no gasto. */
  income: boolean
  /** Descuento de este mes (tramo "Descuento AAAA-MM monto"). */
  discount: number
  /** Lo que toca pagar en la próxima fecha (monto − descuento si es de este mes). */
  dueAmount: number
  /** Próxima fecha a pagar (YYYY-MM-DD): la primera sin pagar de este mes, si no la del siguiente. */
  nextDate: string
  daysLeft: number
  /** Ya se pagaron todas las fechas de este mes. */
  paidThisMonth: boolean
  /** Tiene fechas de este mes sin pagar (va a "Próximos pagos"). */
  pending: boolean
  /** Fechas de este mes que faltan por pagar. */
  remaining: number
  /** Pago en cuotas ("Hasta 2027-01" en la descripción): cuota que toca y total. */
  installment: { n: number; total: number } | null
  /** Ya se pagó la última cuota (este mes); el mes siguiente desaparece. */
  lastPaid: boolean
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
  /** Ingresos fijos (te pagan cada mes). */
  fixedIncome: FixedItem[]
  /** Lo que falta por recibir este mes de los ingresos fijos. */
  incomingTotal: number
  monthExpenses: MonthExpense[]
  /** Libro de todas las cuentas (lo que movió cada saldo desde su saldo inicial), lo más reciente primero. */
  ledger: LedgerEntry[]
}

const WEEKLY_RE = /^cada (domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado)$/i
const DAYS_RE = /^d[ií]as ([\d ,y]+)$/i
const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Cuándo se repite un gasto fijo (ver el comentario de arriba). */
export function parseSchedule(description: string | null, dueDay: number | null): FixedSchedule {
  for (const seg of (description ?? '').split(' · ').map((s) => s.trim())) {
    const w = WEEKLY_RE.exec(seg)
    if (w) {
      const name = stripAccents(w[1]!.toLowerCase())
      return { kind: 'weekly', weekday: WEEKDAYS.findIndex((d) => stripAccents(d) === name) }
    }
    const d = DAYS_RE.exec(seg)
    if (d) {
      const days = [
        ...new Set(
          d[1]!
            .split(/[ ,y]+/)
            .map(Number)
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= 31),
        ),
      ]
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

const UNTIL_RE = /^hasta (\d{4}-\d{2})$/i
const DISCOUNT_RE = /^descuento (\d{4}-\d{2}) (\d+)$/i

/** Descuento de un fijo en un mes (YYYY-MM): suma de sus tramos "Descuento AAAA-MM monto". */
export function discountFor(description: string | null, monthKey: string): number {
  let total = 0
  for (const seg of (description ?? '').split(' · ')) {
    const d = DISCOUNT_RE.exec(seg.trim())
    if (d && d[1] === monthKey) total += Number(d[2])
  }
  return total
}

/** Último mes (YYYY-MM) de un fijo en cuotas — tramo "Hasta 2027-01" —, o null si no termina. */
export function parseUntil(description: string | null): string | null {
  for (const seg of (description ?? '').split(' · ')) {
    const u = UNTIL_RE.exec(seg.trim())
    if (u) return u[1]!
  }
  return null
}

const monthsBetween = (from: string, to: string) => {
  const [fy, fm] = from.split('-').map(Number) as [number, number]
  const [ty, tm] = to.split('-').map(Number) as [number, number]
  return (ty - fy) * 12 + (tm - fm)
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

const bogotaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })
/** YYYY-MM-DD en Bogotá de un instante (o el día tal cual si ya es una fecha). */
function dayOf(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  if (value.length === 10) return value
  const t = Date.parse(value)
  return Number.isNaN(t) ? fallback : bogotaDay.format(new Date(t))
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
  const accountNames: string[] = []
  // "Sin cuenta" no es una cuenta: si quedó guardada entre los medios de
  // pago, saldría repetida y el saldo total la sumaría dos veces.
  const addName = (n: string) => {
    if (n && n.toLowerCase() !== NO_ACCOUNT.toLowerCase() && !accountNames.some((a) => a.toLowerCase() === n.toLowerCase())) accountNames.push(n)
  }
  for (const n of knownAccounts) addName(n.trim())
  for (const p of payments) if (p.payment_method) addName(p.payment_method)
  for (const e of expenses) {
    if (e.category.startsWith(TRANSFER_PREFIX)) addName(e.category.slice(TRANSFER_PREFIX.length).trim())
  }

  // Último saldo escrito a mano por cuenta.
  const snapshots = new Map<string, { amount: number; at: number; iso: string; day: string }>()
  for (const e of expenses) {
    if (!isBalanceSnapshot(e.category)) continue
    const name = e.category.slice(BALANCE_PREFIX.length).trim()
    if (!name) continue
    addName(name)
    const t = at(e.description, e.created_at, e.expense_date)
    const k = name.toLowerCase()
    const prev = snapshots.get(k)
    if (!prev || t > prev.at) snapshots.set(k, { amount: e.amount, at: t, iso: new Date(t).toISOString(), day: e.expense_date })
  }

  const byAccount = new Map<string, AccountBalance>()
  const bucket = (name: string | null) => {
    const k = name ?? NO_ACCOUNT
    let b = byAccount.get(k)
    if (!b) {
      const snap = name ? snapshots.get(name.toLowerCase()) : undefined
      b = {
        name: k,
        income: 0,
        expenses: 0,
        transfersOut: 0,
        transfersIn: 0,
        balance: 0,
        setAmount: snap?.amount ?? null,
        setAt: snap?.iso ?? null,
      }
      byAccount.set(k, b)
    }
    return b
  }
  /** Ya estaba contado en el saldo escrito a mano de esa cuenta: se registró
   * antes del corte, o se registró después pero con fecha de un día anterior
   * (anotar hoy un gasto de la semana pasada no vuelve a restarlo). */
  const beforeSnapshot = (account: string | null, t: number, day: string | null | undefined) => {
    const snap = account ? snapshots.get(account.toLowerCase()) : undefined
    return !!snap && (t <= snap.at || (!!day && day.slice(0, 10) < snap.day))
  }
  const canonical = (m: string | null) => (m ? (accountNames.find((a) => a.toLowerCase() === m.toLowerCase()) ?? m) : null)

  const month = { income: 0, business: 0, personal: 0 }
  const ledger: LedgerEntry[] = []

  for (const p of payments) {
    const account = canonical(p.payment_method)
    const day = dayOf(p.paid_at, today)
    if (p.paid_at?.slice(0, 7) === monthKey) month.income += p.amount
    if (beforeSnapshot(account, at(p.created_at, p.paid_at), day)) continue
    bucket(account).income += p.amount
    ledger.push({
      key: `p:${p.id ?? ledger.length}`,
      expenseId: null,
      paymentId: p.id ?? null,
      date: day,
      name: p.projects?.clients?.name || 'Cobro',
      kind: 'income',
      amount: p.amount,
      tipo: 'Venta',
      account: account ?? NO_ACCOUNT,
      otherAccount: null,
      note: p.projects?.name ?? null,
    })
  }

  const monthExpenses: MonthExpense[] = []
  for (const e of expenses) {
    if (e.due_day !== null || isBalanceSnapshot(e.category)) continue // definición de un fijo o saldo: no es plata que se movió
    const { account, note } = splitAccount(e.description, accountNames)
    const inMonth = e.expense_date.slice(0, 7) === monthKey
    const t = at(e.created_at, e.expense_date)
    const counted = !beforeSnapshot(account, t, e.expense_date)
    const entry = (kind: LedgerKind, name: string, tipo: string, acc: string | null, other: string | null = null): LedgerEntry => ({
      key: `e:${e.id}${kind === 'transfer-in' ? ':in' : ''}`,
      expenseId: e.id,
      paymentId: null,
      date: e.expense_date,
      name,
      kind,
      amount: e.amount,
      tipo,
      account: acc ?? NO_ACCOUNT,
      otherAccount: other,
      note: kind === 'transfer-in' ? null : note,
    })

    if (e.category.startsWith(TRANSFER_PREFIX)) {
      const to = canonical(e.category.slice(TRANSFER_PREFIX.length).trim())
      if (counted) {
        bucket(account).transfersOut += e.amount
        ledger.push(entry('transfer-out', note || `A ${to}`, 'Transferencia', account, to))
      }
      if (!beforeSnapshot(to, t, e.expense_date)) {
        bucket(to).transfersIn += e.amount
        ledger.push(entry('transfer-in', note || `Desde ${account ?? NO_ACCOUNT}`, 'Transferencia', to, account ?? NO_ACCOUNT))
      }
      continue
    }
    if (e.category.startsWith(MOVE_IN_PREFIX) || e.category.startsWith(MOVE_OUT_PREFIX)) {
      if (!counted) continue
      const isIn = e.category.startsWith(MOVE_IN_PREFIX)
      const name = e.category.slice((isIn ? MOVE_IN_PREFIX : MOVE_OUT_PREFIX).length).trim()
      if (isIn) bucket(account).income += e.amount
      else bucket(account).expenses += e.amount
      ledger.push(entry(isIn ? 'income' : 'expense', name, isIn ? 'Entrada' : 'Sin clasificar', account))
      continue
    }
    if (isOtherIncome(e.category)) {
      if (counted) {
        bucket(account).income += e.amount
        ledger.push(entry('income', e.category.split(' · ').slice(1).join(' · ') || 'Ingreso', 'Ingreso', account))
      }
      if (inMonth) month.income += e.amount
      continue
    }
    const personal = isPersonalExpense(e.category)
    if (counted) {
      bucket(account).expenses += e.amount
      ledger.push(entry('expense', stripPersonalPrefix(e.category), personal ? 'Personal' : 'Negocio', account))
    }
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
  for (const b of byAccount.values()) b.balance = (b.setAmount ?? 0) + b.income - b.expenses - b.transfersOut + b.transfersIn
  // Cuentas conocidas primero (aunque estén en cero), "Sin cuenta" al final.
  const accounts = [
    ...accountNames.map((n) => byAccount.get(n)!),
    ...[...byAccount.values()].filter((b) => b.name !== NO_ACCOUNT && !accountNames.includes(b.name)),
    ...(byAccount.has(NO_ACCOUNT) ? [byAccount.get(NO_ACCOUNT)!] : []),
  ]

  const [y, m] = monthKey.split('-').map(Number) as [number, number]
  const fixed: FixedItem[] = expenses
    .filter((e) => e.due_day !== null && e.due_day >= 1 && e.due_day <= 31 && !isBalanceSnapshot(e.category))
    // En cuotas y ya terminado: no se muestra más.
    .filter((e) => {
      const until = parseUntil(e.description)
      return !until || monthKey <= until
    })
    .map((e) => {
      const schedule = parseSchedule(e.description, e.due_day)
      const until = parseUntil(e.description)
      // Solo cuentan las fechas desde que se creó (creado el 21 con día 20: arranca el mes siguiente).
      const thisMonth = occurrences(schedule, y, m - 1).filter((d) => d >= e.expense_date)
      const paidCount = expenses.filter(
        (x) =>
          x.id !== e.id &&
          x.due_day === null &&
          x.category === e.category &&
          x.expense_date.slice(0, 7) === monthKey &&
          (x.description ?? '').includes(FIXED_PAYMENT_MARK),
      ).length
      const unpaid = thisMonth.slice(paidCount)
      const pending = unpaid.length > 0
      const nextDate = pending ? unpaid[0]! : occurrences(schedule, y, m)[0]!
      const startMonth = e.expense_date.slice(0, 7)
      const installment = until
        ? {
            n: Math.min(monthsBetween(startMonth, nextDate.slice(0, 7)), monthsBetween(startMonth, until)) + 1,
            total: monthsBetween(startMonth, until) + 1,
          }
        : null
      const paidThisMonth = thisMonth.length > 0 && !pending
      // Ingreso fijo: venta o ingreso del negocio ("Ingreso · ") o plata que te pasan y no es venta ("Entrada · ").
      const income = isOtherIncome(e.category) || e.category.startsWith(MOVE_IN_PREFIX)
      const discount = Math.min(discountFor(e.description, monthKey), e.amount)
      return {
        id: e.id,
        name: income ? e.category.split(' · ').slice(1).join(' · ') || 'Ingreso' : stripPersonalPrefix(e.category),
        income,
        discount,
        dueAmount: pending && nextDate.slice(0, 7) === monthKey ? e.amount - discount : e.amount,
        amount: e.amount,
        dueDay: e.due_day!,
        schedule,
        scheduleLabel: scheduleLabel(schedule),
        personal: isPersonalExpense(e.category),
        nextDate,
        daysLeft: daysBetween(today, nextDate),
        paidThisMonth,
        pending,
        remaining: unpaid.length,
        installment,
        lastPaid: !!until && paidThisMonth && monthKey === until,
        perMonth: e.amount * occurrences(schedule, y, m - 1).length - discount,
        account: splitAccount(e.description, accountNames).account,
      }
    })
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))

  const expensesFixed = fixed.filter((f) => !f.income)
  const fixedIncome = fixed.filter((f) => f.income)
  const upcoming = expensesFixed.filter((f) => f.pending)
  /** Lo que falta de este mes: cada fecha pendiente, con el descuento del mes una vez. */
  const due = (f: FixedItem) => f.amount * f.remaining - (f.pending ? f.discount : 0)

  return {
    accounts,
    total: accounts.reduce((s, a) => s + a.balance, 0),
    month,
    fixedBusiness: expensesFixed.filter((f) => !f.personal),
    fixedPersonal: expensesFixed.filter((f) => f.personal),
    upcoming,
    upcomingTotal: upcoming.reduce((s, f) => s + due(f), 0),
    fixedIncome,
    incomingTotal: fixedIncome.filter((f) => f.pending).reduce((s, f) => s + due(f), 0),
    monthExpenses: monthExpenses.sort((a, b) => b.date.localeCompare(a.date)),
    ledger: ledger.sort((a, b) => b.date.localeCompare(a.date)),
  }
}
