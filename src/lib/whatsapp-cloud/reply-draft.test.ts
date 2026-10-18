import { describe, expect, it } from 'vitest'
import { buildReplyDraft, type DraftMessage } from './reply-draft'
import { isTattooInquiry, tattooInquirySqlRegex } from './tattoo-keywords'

const inMsg = (body: string, type = 'text'): DraftMessage => ({ direction: 'in', type, body })
const outMsg = (body: string): DraftMessage => ({ direction: 'out', type: 'text', body })

describe('isTattooInquiry', () => {
  it('reconoce consultas de tatuaje', () => {
    expect(isTattooInquiry('Hola, quería cotizar un tatuaje')).toBe(true)
    expect(isTattooInquiry('cuánto me sale una rosa de 10cm en el antebrazo?')).toBe(true)
    expect(isTattooInquiry('Me quiero hacer algo fine line en la costilla')).toBe(true)
    expect(isTattooInquiry('Quiero mi cupo')).toBe(true)
    expect(isTattooInquiry('tienes disponibilidad para el sábado?')).toBe(true)
  })
  it('ignora charla, historias y reels', () => {
    expect(isTattooInquiry('Jajajaja tan mk')).toBe(false)
    expect(isTattooInquiry('Bueno vida ya voy')).toBe(false)
    expect(isTattooInquiry('↩️ Respondió a tu historia\nMe quedó divino el tatuaje')).toBe(false)
    expect(isTattooInquiry('🎬 Compartió un reel\n¿Lo tatuarías?')).toBe(false)
    expect(isTattooInquiry(null)).toBe(false)
  })
  it('la versión SQL usa \\y como borde de palabra', () => {
    expect(tattooInquirySqlRegex()).toContain('\\ytatu')
    expect(tattooInquirySqlRegex()).not.toContain('\\b')
  })
})

describe('buildReplyDraft', () => {
  it('nada si ya respondimos', () => {
    expect(buildReplyDraft([inMsg('hola'), outMsg('Hola cómo estás')])).toBeNull()
  })

  it('primer contacto pidiendo precio: saluda y pide los datos que faltan', () => {
    const d = buildReplyDraft([inMsg('Hola, cuánto cuesta un tatuaje?')], { clientName: 'laura gómez' })!
    expect(d).toMatch(/^Hola Laura cómo estás\?/)
    expect(d).toContain('Para darte el valor exacto')
    expect(d).toContain('parte del cuerpo')
    expect(d).toContain('tamaño')
  })

  it('no pregunta lo que el cliente ya dijo', () => {
    const d = buildReplyDraft([
      outMsg('Hola cómo estás'),
      inMsg('quiero una rosa de 10 cm en el antebrazo en blanco y negro'),
      inMsg('', 'image'),
      inMsg('cuánto me saldría?'),
    ])!
    expect(d).not.toContain('parte del cuerpo')
    expect(d).not.toContain('tamaño')
    expect(d).toContain('Uff está brutal')
    expect(d).toContain('te paso el valor')
  })

  it('ubicación, horario y agenda', () => {
    const d = buildReplyDraft([outMsg('Listo'), inMsg('dónde quedan? y qué día tienes disponibilidad?')])!
    expect(d).toContain('Estamos en')
    expect(d).toContain('para qué fecha')
    expect(d).toContain('lunes a sábado')
  })

  it('va en camino', () => {
    expect(buildReplyDraft([outMsg('Te espero'), inMsg('Ya voy en camino')])).toBe('Dale te espero 🙌')
  })

  it('agradecimiento', () => {
    expect(buildReplyDraft([outMsg('Listo'), inMsg('Gracias!')])).toBe('Dale de una, quedo atento 🫡')
  })

  it('sin pistas no sugiere nada', () => {
    expect(buildReplyDraft([outMsg('Listo'), inMsg('jajaja')])).toBeNull()
  })
})
