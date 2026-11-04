import { describe, expect, it } from 'vitest'
import { buildAgenda, datesIn } from './agenda'

const from = '2026-11-08' // domingo
const at = (day: string, time: string, duration_minutes: number) => ({ scheduled_at: `${day}T${time}:00+00:00`, duration_minutes })
const line = (text: string, day: string) => text.split('\n').find((l) => l.includes(day)) ?? ''

describe('buildAgenda', () => {
  it('un día libre admite un grande a las 10 am', () => {
    expect(buildAgenda([], [], null, from, 1).text).toBe('lunes 9 de noviembre: grande SÍ a las 10 am; pequeño 10:00 a 17:00')
  })
  it('no pone dos grandes el mismo día, aunque el otro sea en la tarde', () => {
    const { text } = buildAgenda([at('2026-11-09', '12:00', 300)], [], null, from, 1)
    expect(text).toContain('grande NO')
  })
  it('una cita corta en la mañana quita el espacio grande y deja el resto', () => {
    const { text } = buildAgenda([at('2026-11-09', '12:00', 60)], [], null, from, 1)
    expect(text).toContain('grande NO; pequeño 10:00 a 12:00 y 13:00 a 17:00')
  })
  it('una cita corta después de las 3 pm no estorba al grande', () => {
    expect(buildAgenda([at('2026-11-09', '15:00', 60)], [], null, from, 1).text).toContain('grande SÍ')
  })
  it('un grande de 10 am llena la mañana', () => {
    expect(buildAgenda([at('2026-11-09', '10:00', 300)], [], null, from, 1).text).toContain('grande NO; pequeño 15:00 a 17:00')
  })
  it('salta domingos, días bloqueados y días cerrados', () => {
    const { text, days } = buildAgenda([], ['2026-11-10'], ['mon', 'tue', 'wed'], from, 7)
    expect(line(text, '10 de noviembre')).toBe('')
    expect(line(text, '12 de noviembre')).toBe('')
    expect(line(text, '15 de noviembre')).toBe('')
    expect(days.has('9 de noviembre')).toBe(true)
  })
})

describe('datesIn', () => {
  it('encuentra fechas escritas', () => {
    expect(datesIn('Te sirve el 21 de Noviembre o el 3 de diciembre?')).toEqual(['21 de noviembre', '3 de diciembre'])
  })
})
