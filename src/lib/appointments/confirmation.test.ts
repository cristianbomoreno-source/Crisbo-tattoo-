import { describe, expect, it } from 'vitest'
import { cancelledText, citaDate, citaTime, confirmedText, firstName, templateChatText } from './confirmation'

const iso = '2026-10-17T10:00:00+00:00' // hora de pared: 10:00 a. m. en Bogotá

describe('confirmación de citas', () => {
  it('formatea la fecha y hora de pared', () => {
    expect(citaDate(iso)).toBe('sábado, 17 de octubre')
    expect(citaTime(iso)).toMatch(/^10:00\sa\.\s?m\.$/)
  })

  it('usa el primer nombre', () => {
    expect(firstName('LAURA gómez')).toBe('Laura')
  })

  it('confirmada incluye la dirección si existe', () => {
    const t = confirmedText('Laura', iso, { address: 'Calle 1 #2-3', mapsUrl: null })
    expect(t).toContain('Tu cita quedó confirmada')
    expect(t).toContain('📍 Calle 1 #2-3')
  })

  it('cancelada da 5 días para reprogramar', () => {
    const t = cancelledText('Laura', iso, new Date('2026-10-16T15:00:00Z'))
    expect(t).toContain('Tienes hasta 5 días (hasta el miércoles, 21 de octubre)')
    expect(t).toContain('perderás tu abono')
  })

  it('el chat guarda el texto de la plantilla con los botones', () => {
    expect(templateChatText('reminder', ['Laura', 'sábado 17 de octubre', '10:00 a. m.'])).toContain(
      'Hola Laura, te recordamos tu cita de tatuaje en Crisbo Tattoo el sábado 17 de octubre a las 10:00 a. m.'
    )
  })
})
