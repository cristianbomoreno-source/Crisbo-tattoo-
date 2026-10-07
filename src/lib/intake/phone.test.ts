import { describe, it, expect } from 'vitest'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('antepone 57 a un celular colombiano de 10 dígitos', () => {
    expect(normalizePhone('350 204 6957')).toBe('573502046957')
  })
  it('respeta números que ya traen indicativo', () => {
    expect(normalizePhone('+57 350 204 6957')).toBe('573502046957')
  })
  it('quita todo lo que no sea dígito', () => {
    expect(normalizePhone('(57) 350-204-6957')).toBe('573502046957')
  })
  it('rechaza números con menos de 10 dígitos', () => {
    expect(normalizePhone('12345')).toBeNull()
  })
  it('rechaza vacío', () => {
    expect(normalizePhone('')).toBeNull()
  })
})
