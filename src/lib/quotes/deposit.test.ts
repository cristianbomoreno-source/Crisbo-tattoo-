import { describe, it, expect } from 'vitest'
import { depositPercentageFor } from './deposit'

describe('depositPercentageFor', () => {
  it('percent: devuelve el value tal cual, independiente del precio', () => {
    expect(depositPercentageFor({ mode: 'percent', value: 20 }, 1400000)).toBe(20)
    expect(depositPercentageFor({ mode: 'percent', value: 20 }, 0)).toBe(20)
  })

  it('percent fuera de rango: clamp 1..100', () => {
    expect(depositPercentageFor({ mode: 'percent', value: 0 }, 1000000)).toBe(1)
    expect(depositPercentageFor({ mode: 'percent', value: -5 }, 1000000)).toBe(1)
    expect(depositPercentageFor({ mode: 'percent', value: 150 }, 1000000)).toBe(100)
  })

  it('fixed: convierte a % contra el precio real (round)', () => {
    expect(depositPercentageFor({ mode: 'fixed', value: 100000 }, 1400000)).toBe(7)
  })

  it('fixed con price 0 → null (no computable, no inventar)', () => {
    expect(depositPercentageFor({ mode: 'fixed', value: 100000 }, 0)).toBeNull()
  })

  it("fixed con price '' (NaN al convertir) → null", () => {
    expect(depositPercentageFor({ mode: 'fixed', value: 100000 }, Number(''))).toBeNull()
  })

  it('fixed con value <= 0 → null', () => {
    expect(depositPercentageFor({ mode: 'fixed', value: 0 }, 1000000)).toBeNull()
    expect(depositPercentageFor({ mode: 'fixed', value: -100 }, 1000000)).toBeNull()
  })

  it('mode null → null', () => {
    expect(depositPercentageFor({ mode: null, value: 20 }, 1000000)).toBeNull()
  })

  it('mode desconocido → null', () => {
    expect(depositPercentageFor({ mode: 'otro', value: 20 }, 1000000)).toBeNull()
  })

  it('deposit null → null', () => {
    expect(depositPercentageFor(null, 1000000)).toBeNull()
  })

  it('deposit undefined → null', () => {
    expect(depositPercentageFor(undefined, 1000000)).toBeNull()
  })

  it('fixed: clamp el % resultante a 1..100', () => {
    expect(depositPercentageFor({ mode: 'fixed', value: 2000000 }, 1000000)).toBe(100)
    expect(depositPercentageFor({ mode: 'fixed', value: 1 }, 10000000)).toBe(1)
  })
})
