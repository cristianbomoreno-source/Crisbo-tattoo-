import { describe, it, expect } from 'vitest'
import { paymentMethodsLine } from './quote-template-data'

describe('paymentMethodsLine', () => {
  it('devuelve null sin métodos', () => {
    expect(paymentMethodsLine(null)).toBeNull()
    expect(paymentMethodsLine(undefined)).toBeNull()
    expect(paymentMethodsLine([])).toBeNull()
  })
  it('junta los métodos con separador', () => {
    expect(paymentMethodsLine(['Nequi', 'Efectivo'])).toBe('Nequi · Efectivo')
  })
  it('descarta entradas vacías', () => {
    expect(paymentMethodsLine(['Nequi', '', '  '])).toBe('Nequi')
  })
})
