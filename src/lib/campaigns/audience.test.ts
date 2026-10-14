import { describe, expect, it } from 'vitest'
import { campaignGroup, firstName, timeAwayLabel } from './audience'

const now = new Date('2026-10-14T12:00:00Z')

describe('campaignGroup', () => {
  it('deja por fuera a quien vino hace menos de 3 meses', () => {
    expect(campaignGroup('2026-08-20', now)).toBeNull()
  })
  it('3 a 12 meses → A, más de un año → B', () => {
    expect(campaignGroup('2026-05-01', now)).toBe('A')
    expect(campaignGroup('2025-06-01', now)).toBe('B')
  })
})

describe('firstName', () => {
  it('toma solo la primera palabra con mayúscula inicial', () => {
    expect(firstName('hellman Fajardo')).toBe('Hellman')
    expect(firstName('  ADRIANA Paez cruz ')).toBe('Adriana')
  })
})

describe('timeAwayLabel', () => {
  it('muestra años y meses', () => {
    expect(timeAwayLabel('2026-05-10', now)).toBe('hace 5 meses')
    expect(timeAwayLabel('2025-08-01', now)).toBe('hace 1 año y 2 meses')
  })
})
