import { describe, expect, it } from 'vitest'
import { DEFAULT_KNOWLEDGE } from './persona'
import { AGENT_MARK, HANDOFF_MARK, allowedAmounts, amountsIn, chatMode, checkReply, decide, firstUnanswered, type AgentMessage } from './guard'

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

describe('decide con el botón IA', () => {
  it('contesta cualquier chat desde que se activó', () => {
    expect(decide([msg('in', 'Hola, tengo una duda')], ON, true).act).toBe(true)
  })
  it('no contesta lo que llegó antes de activarlo', () => {
    expect(decide([msg('in', 'Hola', { created_at: '2026-11-03T10:00:00Z' })], ON, true).act).toBe(false)
  })
  it('se aparta si Crisbo escribe después', () => {
    expect(decide([msg('in', 'Hola'), msg('out', 'Yo te atiendo'), msg('in', 'ok')], ON, true)).toMatchObject({ reason: 'human' })
  })
})

describe('chatMode', () => {
  const conv = { created_at: '2026-11-04T10:00:00Z', client_id: null, channel: 'whatsapp' }
  it('un chat nuevo sin cliente arranca con la IA', () => {
    expect(chatMode(conv, undefined, ON)).toBe('ai')
  })
  it('clientes y chats viejos arrancan con Crisbo', () => {
    expect(chatMode({ ...conv, client_id: 'c1' }, undefined, ON)).toBe('human')
    expect(chatMode({ ...conv, created_at: '2026-10-01T10:00:00Z' }, undefined, ON)).toBe('human')
  })
  it('manda lo que se escogió en el botón', () => {
    expect(chatMode({ ...conv, client_id: 'c1' }, { mode: 'ai', since: ON }, ON)).toBe('ai')
    expect(chatMode(conv, { mode: 'human', since: ON }, ON)).toBe('human')
  })
  it('Instagram sigue con Crisbo', () => {
    expect(chatMode({ ...conv, channel: 'instagram' }, { mode: 'ai', since: ON }, ON)).toBe('human')
  })
  it('con el agente nunca encendido no hay chats en IA', () => {
    expect(chatMode(conv, undefined, null)).toBe('human')
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
  it('una fecha fuera de la agenda no sale y pasa el chat', () => {
    const open = new Set(['14 de noviembre'])
    expect(checkReply(reply(['Te sirve el 14 de noviembre?']), DEFAULT_KNOWLEDGE, open).handoff).toBe(false)
    expect(checkReply(reply(['Te sirve el 15 de noviembre?']), DEFAULT_KNOWLEDGE, open)).toMatchObject({ handoff: true, bubbles: ['Dame un momento y ya te confirmo'] })
  })
  it('deja máximo 3 burbujas y quita las vacías', () => {
    expect(checkReply(reply(['a', '', 'b', 'c', 'd']), DEFAULT_KNOWLEDGE).bubbles).toEqual(['a', 'b', 'c'])
  })
  it('nunca deja salir una grosería', () => {
    expect(checkReply(reply(['Jajajaja qué se va a hacer mk']), DEFAULT_KNOWLEDGE)).toMatchObject({ bubbles: ['Dame un momento y ya te confirmo'], handoff: true })
  })
  it('sin texto, responde en espera y pasa el chat', () => {
    expect(checkReply(reply([]), DEFAULT_KNOWLEDGE)).toMatchObject({ handoff: true })
  })
})

describe('firstUnanswered', () => {
  const NOW = Date.parse('2026-11-04T14:00:00Z')
  const at = (direction: 'in' | 'out', created_at: string) => ({ direction, created_at })
  it('encuentra el primer mensaje que sigue sin respuesta', () => {
    const chat = [at('in', '2026-11-04T04:03:00Z'), at('out', '2026-11-04T05:05:00Z'), at('in', '2026-11-04T05:06:00Z'), at('in', '2026-11-04T05:07:00Z')]
    expect(firstUnanswered(chat, NOW)).toBe('2026-11-04T05:06:00Z')
  })
  it('no marca nada si el último mensaje ya fue respondido', () => {
    expect(firstUnanswered([at('in', '2026-11-04T05:06:00Z'), at('out', '2026-11-04T05:07:00Z')], NOW)).toBeNull()
  })
  it('no marca nada si WhatsApp ya no deja contestar', () => {
    expect(firstUnanswered([at('in', '2026-11-02T05:06:00Z')], NOW)).toBeNull()
  })
  it('deja que el agente conteste aunque Crisbo haya saludado antes', () => {
    const chat = [ad, msg('out', 'Hola', { created_at: '2026-11-04T10:01:00Z' }), msg('in', 'Antebrazo', { created_at: '2026-11-04T10:02:00Z' })]
    expect(decide(chat, firstUnanswered(chat, Date.parse('2026-11-04T11:00:00Z'))!, true)).toEqual({ act: true, adIndex: 2 })
  })
})
