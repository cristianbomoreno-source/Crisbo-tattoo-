import { describe, it, expect } from 'vitest'
import { cashSummary, type CashExpense } from './cash-summary'
import { alertsFromFixedItems } from './alerts'

const exp = (o: Partial<CashExpense>): CashExpense => ({
  id: Math.random().toString(36).slice(2),
  category: 'Otro',
  description: null,
  amount: 0,
  expense_date: '2026-09-01',
  due_day: null,
  ...o,
})

describe('alertsFromFixedItems', () => {
  it('un fijo pagado este mes no sale urgente; uno sin pagar y vencido sí', () => {
    const s = cashSummary({
      today: '2026-10-26',
      accounts: [],
      payments: [],
      expenses: [
        exp({ id: 'luz', category: 'Personal · Recibo luz', amount: 205_000, due_day: 26 }),
        exp({ category: 'Personal · Recibo luz', amount: 187_000, description: 'Pago fijo', expense_date: '2026-10-25' }),
        exp({ id: 'gas', category: 'Personal · Gas', amount: 36_000, due_day: 14 }),
        exp({ id: 'arr', category: 'Arriendo', amount: 2_450_000, due_day: 30, description: 'Descuento 2026-10 260000' }),
        exp({ id: 'tat', category: 'Ingreso · Arriendo tatuador', amount: 700_000, due_day: 27 }),
      ],
    })
    const alerts = alertsFromFixedItems([...s.fixedBusiness, ...s.fixedPersonal, ...s.fixedIncome])
    const by = Object.fromEntries(alerts.map((a) => [a.expense.id, a]))
    expect(by.luz!.status).toBe('ok') // pagada: su próxima fecha es el 26 de noviembre
    expect(by.gas).toMatchObject({ status: 'urgent' }) // 14 de octubre sin pagar
    expect(by.gas!.message).toContain('venció')
    expect(by.arr).toMatchObject({ status: 'warning', expense: { amount: 2_190_000 } })
    expect(by.tat).toBeUndefined()
  })
})
