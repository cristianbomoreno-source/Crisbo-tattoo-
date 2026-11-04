import { describe, expect, it } from 'vitest'
import { DEFAULT_KNOWLEDGE } from './persona'
import { AGENT_MARK, HANDOFF_MARK, allowedAmounts, amountsIn, checkReply, decide, type AgentMessage } from './guard'

const ON = '2026-11-04T00:00:00Z'
const msg = (direction: 'in' | 'out', body: string, extra: Partial<AgentMessage> = {}): AgentMessage => ({
  direction,
  type: 'text',
  body,
  media_filename: null,
  created_at: '2026-11-04T10:00:00Z',
  ...extra,
})
const ad = msg('in', 'Hola Crisbo, quiero un CUPO de noviembre')
const ai = (body = 'Hola') => msg('out', body, { media_filename: AGENT_MARK })

describe('decide', () => {
  it('contesta el mensaje precargado del anuncio', () => {
    expect(decide([ad], ON)).toEqual({ act: true, adIndex: 0 })
  })
  it('reconoce el referral de Meta aunque el cliente cambie el texto', () => {
    expect(decide([msg('in', 'Hola precio', { media_filename: 'ad:123' })], ON).act).toBe(true)
  })
  it('ignora chats que no vienen de la pauta', () => {
    expect(decide([msg('in', 'Hola, cuánto vale?')], ON)).toMatchObject({ act: false, reason: 'not-ad' })
  })
  it('ignora anuncios anteriores a la activación', () => {
    expect(decide([{ ...ad, created_at: '2026-11-03T10:00:00Z' }], ON)).toMatchObject({ act: false, reason: 'not-ad' })
  })
  it('se aparta si Crisbo ya escribió en el chat', () => {
    expect(decide([ad, ai(), msg('out', 'Yo sigo bro'), msg('in', 'listo')], ON)).toMatchObject({ act: false, reason: 'human' })
  })
  it('no vuelve a contestar después de pasar el chat', () => {
    const handed = msg('out', 'Ya te confirmo', { media_filename: HANDOFF_MARK })
    expect(decide([ad, handed, msg('in', 'ok')], ON)).toMatchObject({ act: false, reason: 'handed-off' })
  })
  it('no contesta si el último mensaje ya es suyo', () => {
    expect(decide([ad, ai()], ON)).toMatchObject({ act: false, reason: 'answered' })
  })
  it('una reacción no es un mensaje por responder', () => {
    expect(decide([ad, ai(), msg('in', '👍', { type: 'reaction' })], ON)).toMatchObject({ act: false, reason: 'reaction' })
  })
  it('pasa el chat al llegar al tope de mensajes', () => {
    const many = Array.from({ length: 14 }, () => ai())
    expect(decide([ad, ...many, msg('in', 'y?')], ON)).toMatchObject({ act: false, reason: 'limit', handoff: true })
  })
})

describe('amountsIn', () => {
  it('lee los formatos de precio', () => {
    expect(amountsIn('470.000')).toEqual([470000])
    expect(amountsIn('te sale en 1100000')).toEqual([1100000])
    expect(amountsIn('$1.100.000')).toEqual([1100000])
    expect(amountsIn('unos 300 mil')).toEqual([300000])
    expect(amountsIn('1.1 millones')).toEqual([1100000])
    expect(amountsIn('500k')).toEqual([500000])
  })
  it('no confunde la llave, el teléfono ni la dirección con un precio', () => {
    expect(amountsIn('llave 1019126345')).toEqual([])
    expect(amountsIn('al 3202107769')).toEqual([])
    expect(amountsIn('Cl. 137b #57b - 39 piso 2')).toEqual([])
    expect(amountsIn('hasta 15 cm, 2 sesiones de 5 horas')).toEqual([])
  })
})

describe('checkReply', () => {
  const reply = (mensajes: string[], pasarACrisbo = false) => ({ mensajes, pasarACrisbo, motivo: null, enviarUbicacion: false })

  it('los valores de la oferta y su abono están autorizados', () => {
    expect([...allowedAmounts(DEFAULT_KNOWLEDGE)]).toEqual(expect.arrayContaining([470000, 1100000, 100000, 200000]))
    expect(checkReply(reply(['Sería de 470.000', 'El abono es 100000']), DEFAULT_KNOWLEDGE).handoff).toBe(false)
  })
  it('un precio inventado no sale y pasa el chat', () => {
    const r = checkReply(reply(['Te lo dejo en 400.000']), DEFAULT_KNOWLEDGE)
    expect(r.bubbles).toEqual(['Dame un momento y ya te confirmo'])
    expect(r.handoff).toBe(true)
  })
  it('deja máximo 3 burbujas y quita las vacías', () => {
    expect(checkReply(reply(['a', '', 'b', 'c', 'd']), DEFAULT_KNOWLEDGE).bubbles).toEqual(['a', 'b', 'c'])
  })
  it('sin texto, responde en espera y pasa el chat', () => {
    expect(checkReply(reply([]), DEFAULT_KNOWLEDGE)).toMatchObject({ handoff: true })
  })
})
