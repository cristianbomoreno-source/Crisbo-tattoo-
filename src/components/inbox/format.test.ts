import { describe, expect, it } from 'vitest'
import { formatDayLabel, formatListTime, sameDay } from './format'

describe('formato de la bandeja en hora de Colombia', () => {
  // 23:30 en Bogotá = 04:30 UTC del día siguiente.
  const late = '2026-10-12T04:30:00Z'
  it('cuenta el día según Bogotá, no según UTC', () => {
    expect(formatDayLabel(late, new Date('2026-10-12T15:00:00Z'))).toBe('Ayer')
    expect(formatDayLabel(late, new Date('2026-10-12T04:45:00Z'))).toBe('Hoy')
    expect(sameDay(late, '2026-10-11T20:00:00Z')).toBe(true)
  })
  it('la hora sale en hora de Colombia', () => {
    expect(formatListTime(late, new Date('2026-10-12T04:45:00Z'))).toMatch(/^11:30/)
  })
})
