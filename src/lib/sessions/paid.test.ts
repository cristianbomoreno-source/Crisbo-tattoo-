import { describe, expect, it } from 'vitest'
import { isProjectFullyPaid } from './paid'

describe('isProjectFullyPaid', () => {
  it('es pagado cuando los pagos cubren el total', () => {
    expect(isProjectFullyPaid({ total_value: 800000, payments: [{ amount: 300000 }, { amount: 500000 }] })).toBe(true)
  })

  it('es pagado si los pagos superan el total', () => {
    expect(isProjectFullyPaid({ total_value: 100, payments: [{ amount: 150 }] })).toBe(true)
  })

  it('no es pagado con saldo pendiente', () => {
    expect(isProjectFullyPaid({ total_value: 800000, payments: [{ amount: 799999 }] })).toBe(false)
  })

  it('no es pagado sin pagos', () => {
    expect(isProjectFullyPaid({ total_value: 800000, payments: [] })).toBe(false)
    expect(isProjectFullyPaid({ total_value: 800000, payments: null })).toBe(false)
  })

  it('no se marca como pagado si el proyecto no tiene valor total', () => {
    expect(isProjectFullyPaid({ total_value: 0, payments: [{ amount: 50000 }] })).toBe(false)
    expect(isProjectFullyPaid({ total_value: null, payments: [] })).toBe(false)
    expect(isProjectFullyPaid(null)).toBe(false)
    expect(isProjectFullyPaid(undefined)).toBe(false)
  })

  it('acepta montos que llegan como texto (numeric de Postgres)', () => {
    expect(
      isProjectFullyPaid({
        total_value: '800000' as unknown as number,
        payments: [{ amount: '800000' as unknown as number }],
      })
    ).toBe(true)
  })
})
