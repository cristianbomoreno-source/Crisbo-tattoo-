import { describe, it, expect } from 'vitest'
import { cashSummary, parseSchedule, scheduleTag, type CashExpense } from './cash-summary'

const exp = (o: Partial<CashExpense>): CashExpense => ({
  id: Math.random().toString(36).slice(2),
  category: 'Insumos',
  description: null,
  amount: 0,
  expense_date: '2026-10-05',
  due_day: null,
  ...o,
})

describe('cashSummary', () => {
  it('suma por cuenta cobros, ingresos sueltos y gastos con la cuenta en la descripción', () => {
    const s = cashSummary({
      today: '2026-10-26',
      accounts: ['Nequi', 'Efectivo'],
      payments: [
        { amount: 500_000, paid_at: '2026-10-10T15:00:00Z', payment_method: 'nequi' },
        { amount: 200_000, paid_at: '2026-09-10T15:00:00Z', payment_method: null },
      ],
      expenses: [
        exp({ amount: 80_000, description: 'Nequi · tintas' }),
        exp({ category: 'Arriendo', amount: 1_000_000, due_day: 5, expense_date: '2026-10-01' }),
        exp({ category: 'Ingreso · Venta de producto', amount: 30_000, description: 'Efectivo' }),
        exp({ category: 'Personal · Comida', amount: 20_000, description: 'almuerzo' }),
      ],
    })
    const by = Object.fromEntries(s.accounts.map((a) => [a.name, a.balance]))
    expect(by).toEqual({ Nequi: 420_000, Efectivo: 30_000, 'Sin cuenta': 180_000 })
    expect(s.total).toBe(630_000)
    expect(s.month).toEqual({ income: 530_000, business: 80_000, personal: 20_000 })
    expect(s.monthExpenses.find((e) => e.personal)?.name).toBe('Comida')
  })

  it('gastos fijos: la definición no es gasto; cada mes queda pendiente hasta un "Pago fijo"', () => {
    const s = cashSummary({
      today: '2026-10-26',
      accounts: [],
      payments: [],
      expenses: [
        exp({ id: 'arriendo', category: 'Arriendo', amount: 1_500_000, due_day: 5, expense_date: '2026-08-01' }),
        exp({ category: 'Arriendo', amount: 1_500_000, description: 'Nequi · Pago fijo', expense_date: '2026-10-04' }),
        exp({ id: 'luz', category: 'Servicios', amount: 200_000, due_day: 31, expense_date: '2026-09-01' }),
        exp({ id: 'cel', category: 'Personal · Celular', amount: 60_000, due_day: 20, expense_date: '2026-10-21', description: 'Nequi' }),
      ],
    })
    // Las definiciones no restan plata; solo el pago del arriendo.
    expect(s.month.business).toBe(1_500_000)
    expect(s.monthExpenses).toHaveLength(1)
    const arriendo = s.fixedBusiness.find((f) => f.id === 'arriendo')!
    expect(arriendo.paidThisMonth).toBe(true)
    expect(arriendo.nextDate).toBe('2026-11-05')
    const luz = s.fixedBusiness.find((f) => f.id === 'luz')!
    expect(luz).toMatchObject({ paidThisMonth: false, nextDate: '2026-10-31', daysLeft: 5 })
    // Creado el 21 con día 20: este mes ya pasó, arranca en noviembre.
    expect(s.fixedPersonal[0]).toMatchObject({ name: 'Celular', paidThisMonth: false, pending: false, nextDate: '2026-11-20' })
    expect(s.upcoming.map((f) => f.id)).toEqual(['luz'])
    expect(s.upcomingTotal).toBe(200_000)
  })

  it('un fijo sin pagar cuya fecha ya pasó queda con días negativos (vencido)', () => {
    const s = cashSummary({
      today: '2026-10-26',
      accounts: [],
      payments: [],
      expenses: [exp({ category: 'Internet', amount: 90_000, due_day: 10, expense_date: '2026-09-02' })],
    })
    expect(s.upcoming[0]).toMatchObject({ nextDate: '2026-10-10', daysLeft: -16 })
  })

  it('semanal: la cadena cada domingo pide cada domingo del mes que falte', () => {
    // Octubre 2026: domingos 4, 11, 18, 25. Hoy 26; ya se pagaron 3.
    const pago = (d: string) => exp({ category: 'Personal · Cadena', amount: 50_000, description: 'Nequi · Pago fijo', expense_date: d })
    const s = cashSummary({
      today: '2026-10-26',
      accounts: ['Nequi'],
      payments: [],
      expenses: [
        exp({ id: 'cadena', category: 'Personal · Cadena', amount: 50_000, due_day: 1, description: 'Nequi · Cada domingo', expense_date: '2026-09-01' }),
        pago('2026-10-04'),
        pago('2026-10-11'),
        pago('2026-10-19'),
      ],
    })
    const c = s.fixedPersonal[0]!
    expect(c).toMatchObject({ scheduleLabel: 'Cada domingo', pending: true, remaining: 1, nextDate: '2026-10-25', daysLeft: -1, perMonth: 200_000, account: 'Nequi' })
    expect(s.upcomingTotal).toBe(50_000)
  })

  it('varios días al mes: cada fecha es un pago', () => {
    const s = cashSummary({
      today: '2026-10-12',
      accounts: [],
      payments: [],
      expenses: [
        exp({ id: 'q', category: 'Nómina', amount: 700_000, due_day: 15, description: 'Días 15, 30', expense_date: '2026-09-01' }),
      ],
    })
    expect(s.fixedBusiness[0]).toMatchObject({ scheduleLabel: 'Días 15 y 30', remaining: 2, nextDate: '2026-10-15', perMonth: 1_400_000 })
    expect(s.upcomingTotal).toBe(1_400_000)
  })

  it('saldo escrito a mano: es el punto de partida y crea la cuenta', () => {
    const s = cashSummary({
      today: '2026-10-26',
      accounts: ['Nequi'],
      payments: [
        { amount: 100_000, paid_at: '2026-10-20T15:00:00Z', created_at: '2026-10-20T15:00:00Z', payment_method: 'Nequi' },
        { amount: 40_000, paid_at: '2026-10-26T18:00:00Z', created_at: '2026-10-26T18:00:00Z', payment_method: 'Nequi' },
      ],
      expenses: [
        exp({ category: 'Saldo · Nequi', amount: 300_000, description: '2026-10-25T12:00:00.000Z', expense_date: '2026-10-25' }),
        exp({ category: 'Saldo · Bancolombia', amount: 1_000_000, description: '2026-10-25T12:00:00.000Z', expense_date: '2026-10-25' }),
        exp({ category: 'Insumos', amount: 10_000, description: 'Bancolombia', created_at: '2026-10-26T10:00:00Z', expense_date: '2026-10-26' }),
        // Anotado después del corte pero con fecha anterior: ya estaba en el saldo.
        exp({ category: 'Personal · Mercado', amount: 250_000, description: 'Bancolombia', created_at: '2026-10-26T11:00:00Z', expense_date: '2026-10-24' }),
      ],
    })
    const by = Object.fromEntries(s.accounts.map((a) => [a.name, a.balance]))
    expect(by).toEqual({ Nequi: 340_000, Bancolombia: 990_000 })
    // El saldo no es gasto del mes.
    expect(s.month.business).toBe(10_000)
    expect(s.month.personal).toBe(250_000)
  })

  it('horario: se guarda y se lee de la descripción', () => {
    expect(parseSchedule('Nequi · Cada sábado', 1)).toEqual({ kind: 'weekly', weekday: 6 })
    expect(parseSchedule('Días 5, 20', 5)).toEqual({ kind: 'monthly', days: [5, 20] })
    expect(parseSchedule('Nequi', 8)).toEqual({ kind: 'monthly', days: [8] })
    expect(scheduleTag({ kind: 'weekly', weekday: 0 })).toBe('Cada domingo')
    expect(scheduleTag({ kind: 'monthly', days: [8] })).toBeNull()
  })

  it('en cuotas: arranca el mes que se dice, cuenta la cuota y desaparece al terminar', () => {
    const def = exp({ id: 'p', category: 'Personal · Préstamo esposa', amount: 476_667, due_day: 30, description: 'Hasta 2027-01', expense_date: '2026-11-01' })
    const oct = cashSummary({ today: '2026-10-26', accounts: [], payments: [], expenses: [def] })
    expect(oct.fixedPersonal[0]).toMatchObject({ pending: false, nextDate: '2026-11-30', installment: { n: 1, total: 3 } })
    const dec = cashSummary({ today: '2026-12-10', accounts: [], payments: [], expenses: [def] })
    expect(dec.fixedPersonal[0]).toMatchObject({ pending: true, installment: { n: 2, total: 3 } })
    const jan = cashSummary({
      today: '2027-01-30',
      accounts: [],
      payments: [],
      expenses: [def, exp({ category: 'Personal · Préstamo esposa', amount: 476_667, description: 'Pago fijo', expense_date: '2027-01-30' })],
    })
    expect(jan.fixedPersonal[0]).toMatchObject({ lastPaid: true, installment: { n: 3, total: 3 } })
    const feb = cashSummary({ today: '2027-02-02', accounts: [], payments: [], expenses: [def] })
    expect(feb.fixedPersonal).toHaveLength(0)
  })

  it('libro: entradas y salidas que no son venta ni gasto, y traslados entre cuentas', () => {
    const s = cashSummary({
      today: '2026-10-26',
      accounts: ['Daviplata', 'Efectivo'],
      payments: [{ id: 'p1', amount: 370_000, paid_at: '2026-10-24T23:07:00Z', payment_method: 'Daviplata', projects: { name: 'Cita', clients: { name: 'Tatiana' } } }],
      expenses: [
        exp({ category: 'Saldo · Daviplata', amount: 100_000, description: '2026-10-01T05:00:00.000Z', expense_date: '2026-10-01' }),
        exp({ category: 'Entrada · Cadena (mi turno)', amount: 2_100_000, description: 'Daviplata', expense_date: '2026-10-03' }),
        exp({ category: 'Salida · Pago deuda Angie', amount: 350_000, description: 'Daviplata', expense_date: '2026-10-16' }),
        exp({ id: 't', category: 'Transferencia · Efectivo', amount: 200_000, description: 'Daviplata · Retiro cajero', expense_date: '2026-10-18' }),
        exp({ category: 'Personal · Mercado', amount: 250_000, description: 'Daviplata', expense_date: '2026-10-24' }),
      ],
    })
    const dav = s.accounts.find((a) => a.name === 'Daviplata')!
    expect(dav).toMatchObject({ setAmount: 100_000, income: 2_470_000, expenses: 600_000, transfersOut: 200_000, balance: 1_770_000 })
    expect(s.accounts.find((a) => a.name === 'Efectivo')).toMatchObject({ transfersIn: 200_000, balance: 200_000 })
    // Ni la cadena ni la deuda son ventas o gastos del mes.
    expect(s.month).toEqual({ income: 370_000, business: 0, personal: 250_000 })
    const davLedger = s.ledger.filter((e) => e.account === 'Daviplata')
    expect(davLedger.map((e) => [e.kind, e.tipo, e.name])).toEqual([
      ['income', 'Venta', 'Tatiana'],
      ['expense', 'Personal', 'Mercado'],
      ['transfer-out', 'Transferencia', 'Retiro cajero'],
      ['expense', 'Sin clasificar', 'Pago deuda Angie'],
      ['income', 'Entrada', 'Cadena (mi turno)'],
    ])
    expect(s.ledger.find((e) => e.kind === 'transfer-in')).toMatchObject({ account: 'Efectivo', otherAccount: 'Daviplata' })
  })
})
