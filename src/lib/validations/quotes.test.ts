import { describe, it, expect } from 'vitest'
import { createQuoteSchema, updateQuoteSchema } from './quotes'

describe('createQuoteSchema', () => {
  it('acepta campos nuevos del wizard (size, color, skin_tone, service)', () => {
    const clientId = '123e4567-e89b-12d3-a456-426614174000'
    const r = createQuoteSchema.safeParse({
      client_id: clientId,
      size: 'Mediano (10 a 20 cm)',
      color: 'Negro',
      skin_tone: 'Medio',
      service: 'Cover up',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.size).toBe('Mediano (10 a 20 cm)')
      expect(r.data.color).toBe('Negro')
      expect(r.data.skin_tone).toBe('Medio')
      expect(r.data.service).toBe('Cover up')
    }
  })

  it('es retrocompatible sin campos del wizard (size, color, skin_tone, service)', () => {
    const clientId = '123e4567-e89b-12d3-a456-426614174000'
    const r = createQuoteSchema.safeParse({
      client_id: clientId,
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.size).toBeUndefined()
      expect(r.data.color).toBeUndefined()
      expect(r.data.skin_tone).toBeUndefined()
      expect(r.data.service).toBeUndefined()
    }
  })
})

// El schema ya existía (createQuoteSchema.partial() + status opcional) antes de
// este ticket; estos tests no lo escriben en RED, lo fijan (pin) en verde para
// que updateQuoteAction tenga una contract cubierta por tests.
describe('updateQuoteSchema', () => {
  it('acepta un parcial válido (solo price y session_count)', () => {
    const r = updateQuoteSchema.safeParse({ price: 500000, session_count: 3 })
    expect(r.success).toBe(true)
  })

  it('rechaza precio negativo', () => {
    expect(updateQuoteSchema.safeParse({ price: -100 }).success).toBe(false)
  })

  it('rechaza deposit_percentage mayor a 100', () => {
    expect(updateQuoteSchema.safeParse({ deposit_percentage: 150 }).success).toBe(false)
  })

  it('rechaza un status inválido', () => {
    expect(updateQuoteSchema.safeParse({ status: 'archived' }).success).toBe(false)
  })
})
