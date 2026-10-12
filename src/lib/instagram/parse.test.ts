import { describe, expect, it } from 'vitest'
import { normalizeIgUsername, parseInstagramWebhook, splitIgText } from './parse'

const ACCOUNT = '17841400000000000'
const CUSTOMER = '1234567890123456'

function webhook(messaging: object[]) {
  return { object: 'instagram', entry: [{ id: ACCOUNT, time: 1, messaging }] }
}

describe('parseInstagramWebhook', () => {
  it('lee un texto entrante', () => {
    const [e] = parseInstagramWebhook(
      webhook([
        { sender: { id: CUSTOMER }, recipient: { id: ACCOUNT }, timestamp: 1760000000000, message: { mid: 'm1', text: 'Hola' } },
      ])
    )
    expect(e).toMatchObject({ igUserId: ACCOUNT, customerId: CUSTOMER, messageId: 'm1', echo: false, type: 'text', body: 'Hola' })
    expect(e!.timestamp).toBe(new Date(1760000000000).toISOString())
  })

  it('en un eco, el cliente es el destinatario', () => {
    const [e] = parseInstagramWebhook(
      webhook([
        { sender: { id: ACCOUNT }, recipient: { id: CUSTOMER }, timestamp: 1, message: { mid: 'm2', text: 'Listo', is_echo: true } },
      ])
    )
    expect(e).toMatchObject({ customerId: CUSTOMER, echo: true })
  })

  it('fotos, publicaciones compartidas y respuestas a historias', () => {
    const events = parseInstagramWebhook(
      webhook([
        {
          sender: { id: CUSTOMER },
          recipient: { id: ACCOUNT },
          timestamp: 1,
          message: { mid: 'a', attachments: [{ type: 'image', payload: { url: 'https://cdn/x.jpg' } }] },
        },
        {
          sender: { id: CUSTOMER },
          recipient: { id: ACCOUNT },
          timestamp: 1,
          message: { mid: 'b', attachments: [{ type: 'ig_reel', payload: { url: 'https://ig/reel', title: 'Diseño' } }] },
        },
        {
          sender: { id: CUSTOMER },
          recipient: { id: ACCOUNT },
          timestamp: 1,
          message: { mid: 'c', text: '¿Cuánto vale?', reply_to: { story: { id: 's', url: 'https://cdn/s' } } },
        },
      ])
    )
    expect(events[0]).toMatchObject({ type: 'image', mediaUrl: 'https://cdn/x.jpg' })
    expect(events[1]).toMatchObject({ type: 'share', body: '🎬 Compartió un reel\nDiseño\nhttps://ig/reel' })
    expect(events[2]).toMatchObject({ type: 'text', body: '↩️ Respondió a tu historia\n¿Cuánto vale?' })
  })

  it('ignora mensajes borrados, otros objetos y el formato "changes"', () => {
    expect(
      parseInstagramWebhook(
        webhook([{ sender: { id: CUSTOMER }, recipient: { id: ACCOUNT }, timestamp: 1, message: { mid: 'd', is_deleted: true } }])
      )
    ).toEqual([])
    expect(parseInstagramWebhook({ object: 'page', entry: [] })).toEqual([])
    const viaChanges = parseInstagramWebhook({
      object: 'instagram',
      entry: [
        {
          id: ACCOUNT,
          changes: [
            { field: 'messages', value: { sender: { id: CUSTOMER }, recipient: { id: ACCOUNT }, timestamp: 1, message: { mid: 'e', text: 'x' } } },
          ],
        },
      ],
    })
    expect(viaChanges).toHaveLength(1)
  })
})

describe('normalizeIgUsername', () => {
  it('acepta @, enlaces y mayúsculas', () => {
    expect(normalizeIgUsername('@Crisbo.Tattoo')).toBe('crisbo.tattoo')
    expect(normalizeIgUsername('https://www.instagram.com/crisbo_tattoo/?hl=es')).toBe('crisbo_tattoo')
    expect(normalizeIgUsername('no válido!')).toBeNull()
    expect(normalizeIgUsername(null)).toBeNull()
  })
})

describe('splitIgText', () => {
  it('parte textos largos sin cortar palabras', () => {
    const text = Array.from({ length: 300 }, (_, i) => `palabra${i}`).join(' ')
    const chunks = splitIgText(text, 1000)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every((c) => c.length <= 1000)).toBe(true)
    expect(chunks.join(' ')).toBe(text)
  })
  it('un texto corto queda igual', () => {
    expect(splitIgText('Hola')).toEqual(['Hola'])
  })
})
