import { describe, it, expect } from 'vitest'
import { cashSummary, type CashExpense } from './cash-summary'

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

  it('gastos fijos: pagado por su propia fila o por un "Pago fijo" del mes; si no, fecha de este mes', () => {
    const s = cashSummary({
      today: '2026-10-26',
      accounts: [],
      payments: [],
      expenses: [
        exp({ id: 'arriendo', category: 'Arriendo', amount: 1_500_000, due_day: 5, expense_date: '2026-08-01' }),
        exp({ category: 'Arriendo', amount: 1_500_000, description: 'Nequi · Pago fijo', expense_date: '2026-10-04' }),
        exp({ id: 'luz', category: 'Servicios', amount: 200_000, due_day: 31, expense_date: '2026-09-01' }),
        exp({ id: 'cel', category: 'Personal · Celular', amount: 60_000, due_day: 20, expense_date: '2026-10-01' }),
      ],
    })
    const arriendo = s.fixedBusiness.find((f) => f.id === 'arriendo')!
    expect(arriendo.paidThisMonth).toBe(true)
    expect(arriendo.nextDate).toBe('2026-11-05')
    const luz = s.fixedBusiness.find((f) => f.id === 'luz')!
    expect(luz).toMatchObject({ paidThisMonth: false, nextDate: '2026-10-31', daysLeft: 5 })
    expect(s.fixedPersonal[0]).toMatchObject({ name: 'Celular', paidThisMonth: true, nextDate: '2026-11-20' })
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
})
