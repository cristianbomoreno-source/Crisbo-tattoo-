import { describe, expect, it } from 'vitest'
import { buildClientTone, buildExamples, hasConfidence, redact, type ExampleRow } from './examples'

let minute = 0
const row = (conversation_id: string, direction: 'in' | 'out', body: string, extra: Partial<ExampleRow> = {}): ExampleRow => ({
  conversation_id,
  direction,
  type: 'text',
  body,
  media_filename: null,
  created_at: `2026-11-01T10:${String(minute++ % 60).padStart(2, '0')}:00Z`,
  ...extra,
})
const chat = (id: string, question: string, answer: string) => [row(id, 'in', 'Quiero cotizar un tatuaje'), row(id, 'out', 'Claro que si'), row(id, 'in', question), row(id, 'out', answer)]

describe('buildExamples', () => {
  it('prefiere respuestas a mensajes parecidos', () => {
    const rows = [...chat('a', 'Cuanto dura la sesion', 'Depende del tamaño'), ...chat('b', 'Donde queda ubicado', 'Estamos en colina campestre')]
    expect(buildExamples(rows, 'donde estan ubicados?', new Set()).startsWith('Cliente: Donde queda ubicado')).toBe(true)
  })
  it('deja por fuera chats personales y de amigos', () => {
    const friend = [row('a', 'in', 'Quiero cotizar un tatuaje'), row('a', 'out', 'Que hizo mk')]
    const personal = chat('b', 'Donde queda', 'Por aca')
    expect(buildExamples([...friend, ...personal], 'donde', new Set(['b']))).toBe('')
  })
  it('deja por fuera chats que no son de tatuajes', () => {
    expect(buildExamples([row('a', 'in', 'Se borran las citas'), row('a', 'out', 'Ya reviso')], 'citas', new Set())).toBe('')
  })
  it('no aprende de sus propias respuestas', () => {
    const rows = [row('a', 'in', 'Quiero cotizar un tatuaje'), row('a', 'out', 'Claro', { media_filename: 'ai-agent' })]
    expect(buildExamples(rows, 'tatuaje', new Set())).toBe('')
  })
})

describe('buildClientTone', () => {
  const talk = (id: string, reply: string) => [row(id, 'in', 'Hola'), row(id, 'out', reply)]
  it('junta lo que Crisbo le dijo a esa persona en todos sus chats', () => {
    const tone = buildClientTone([...talk('wa', 'Quiubo Caro'), ...talk('ig', 'Dime reina'), ...talk('wa', 'Listo Caro')])
    expect(tone).toContain('Quiubo Caro')
    expect(tone).toContain('Dime reina')
  })
  it('necesita varias respuestas para saber cómo le habla', () => {
    expect(buildClientTone([...talk('a', 'Hola'), ...talk('a', 'Claro')])).toBe('')
  })
  it('no aprende del agente y tapa los valores', () => {
    const rows = [...talk('a', 'Te sale en 300000'), ...talk('a', 'Listo'), ...talk('a', 'Dale'), row('a', 'in', 'Hola'), row('a', 'out', 'Soy el agente', { media_filename: 'ai-agent' })]
    const tone = buildClientTone(rows)
    expect(tone).toContain('[valor]')
    expect(tone).not.toContain('300000')
    expect(tone).not.toContain('Soy el agente')
  })
})

describe('hasConfidence', () => {
  it('reconoce el trato de cualquiera de los dos', () => {
    expect(hasConfidence([row('a', 'in', 'Que hubo mk')])).toBe(true)
    expect(hasConfidence([row('a', 'out', 'Dime papito')])).toBe(true)
  })
  it('no la saca de un chat normal ni de lo que dijo el agente', () => {
    expect(hasConfidence([row('a', 'in', 'Quiero un perro en el brazo')])).toBe(false)
    expect(hasConfidence([row('a', 'out', 'Dale mk', { media_filename: 'ai-agent' })])).toBe(false)
  })
})

describe('redact', () => {
  it('tapa precios, teléfonos y correos', () => {
    expect(redact('Te sale en 450.000')).toBe('Te sale en [valor]')
    expect(redact('Son 300 mil')).toBe('Son [valor]')
    expect(redact('Sería de 470000')).toBe('Sería de [valor]')
    expect(redact('Escribe al 3202107769 o a ana@mail.com')).toBe('Escribe al [valor] o a [correo]')
  })
})
