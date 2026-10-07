import { describe, it, expect } from 'vitest'
import { sessionPaid } from './metrics'

describe('sessionPaid', () => {
  const payments = [
    { amount: 100_000, session_id: 's1' },
    { amount: 50_000, session_id: 's1' },
    { amount: 200_000, session_id: 's2' },
    { amount: 30_000, session_id: null },
  ]
  it('suma solo los pagos de la sesión dada', () => {
    expect(sessionPaid(payments, 's1')).toBe(150_000)
    expect(sessionPaid(payments, 's2')).toBe(200_000)
  })
  it('devuelve 0 si la sesión no tiene pagos', () => {
    expect(sessionPaid(payments, 'sX')).toBe(0)
    expect(sessionPaid([], 's1')).toBe(0)
  })
})
