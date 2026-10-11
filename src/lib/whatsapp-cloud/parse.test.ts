import { describe, expect, it } from 'vitest'
import {
  isServiceWindowOpen,
  messagePreview,
  normalizeWaPhone,
  parseWebhook,
  shouldAdvanceStatus,
} from './parse'

describe('normalizeWaPhone', () => {
  it('agrega +57 a números colombianos de 10 dígitos', () => {
    expect(normalizeWaPhone('300 123 4567')).toBe('573001234567')
  })
  it('respeta números con indicativo', () => {
    expect(normalizeWaPhone('+57 300-123-4567')).toBe('573001234567')
    expect(normalizeWaPhone('+1 (415) 555 0100')).toBe('14155550100')
  })
  it('devuelve null sin dígitos', () => {
    expect(normalizeWaPhone('')).toBeNull()
    expect(normalizeWaPhone(null)).toBeNull()
    expect(normalizeWaPhone('abc')).toBeNull()
  })
})

describe('isServiceWindowOpen', () => {
  const now = Date.parse('2026-10-11T12:00:00Z')
  it('abierta dentro de 24 h', () => {
    expect(isServiceWindowOpen('2026-10-10T13:00:00Z', now)).toBe(true)
  })
  it('cerrada pasadas 24 h o sin mensajes del cliente', () => {
    expect(isServiceWindowOpen('2026-10-10T11:59:00Z', now)).toBe(false)
    expect(isServiceWindowOpen(null, now)).toBe(false)
  })
})

describe('parseWebhook', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '573000000000', phone_number_id: 'PNID' },
              contacts: [{ profile: { name: 'Laura' }, wa_id: '573001234567' }],
              messages: [
                { from: '573001234567', id: 'wamid.1', timestamp: '1760184000', type: 'text', text: { body: 'Hola!' } },
                {
                  from: '573001234567',
                  id: 'wamid.2',
                  timestamp: '1760184001',
                  type: 'image',
                  image: { id: 'MEDIA1', mime_type: 'image/jpeg', caption: 'referencia' },
                },
                { from: '573001234567', id: 'wamid.3', timestamp: '1760184002', type: 'button', button: { text: 'Sí, confirmo' } },
                { from: '573001234567', id: 'wamid.4', timestamp: '1760184003', type: 'order' },
              ],
              statuses: [
                { id: 'wamid.out1', status: 'delivered' },
                { id: 'wamid.out2', status: 'failed', errors: [{ title: 'Re-engagement', message: 'Fuera de ventana' }] },
                { id: 'wamid.out3', status: 'deleted' },
              ],
            },
          },
        ],
      },
    ],
  }

  it('extrae mensajes de texto, media y botones', () => {
    const { messages } = parseWebhook(payload)
    expect(messages).toHaveLength(4)
    expect(messages[0]).toMatchObject({
      phoneNumberId: 'PNID',
      waId: '573001234567',
      contactName: 'Laura',
      waMessageId: 'wamid.1',
      type: 'text',
      body: 'Hola!',
      timestamp: new Date(1760184000 * 1000).toISOString(),
    })
    expect(messages[1]).toMatchObject({ type: 'image', body: 'referencia', mediaId: 'MEDIA1', mediaMime: 'image/jpeg' })
    expect(messages[2]).toMatchObject({ type: 'text', body: 'Sí, confirmo' })
    expect(messages[3]).toMatchObject({ type: 'unsupported', body: null })
  })

  it('extrae estados válidos con su error', () => {
    const { statuses } = parseWebhook(payload)
    expect(statuses).toEqual([
      { phoneNumberId: 'PNID', waMessageId: 'wamid.out1', status: 'delivered', error: null },
      { phoneNumberId: 'PNID', waMessageId: 'wamid.out2', status: 'failed', error: 'Fuera de ventana' },
    ])
  })

  it('tolera payloads vacíos o raros', () => {
    expect(parseWebhook(null)).toEqual({ messages: [], statuses: [], echoes: [] })
    expect(parseWebhook({ entry: [{ changes: [{ field: 'account_update', value: {} }] }] })).toEqual({
      messages: [],
      statuses: [],
      echoes: [],
    })
  })
})

describe('messagePreview', () => {
  it('muestra texto o etiqueta de media', () => {
    expect(messagePreview('text', 'Hola')).toBe('Hola')
    expect(messagePreview('image', null)).toBe('📷 Foto')
    expect(messagePreview('image', 'mi idea')).toBe('📷 Foto: mi idea')
    expect(messagePreview('location', 'x')).toBe('📍 Ubicación')
  })
})

describe('shouldAdvanceStatus', () => {
  it('solo avanza, nunca retrocede', () => {
    expect(shouldAdvanceStatus('sent', 'delivered')).toBe(true)
    expect(shouldAdvanceStatus('read', 'delivered')).toBe(false)
    expect(shouldAdvanceStatus('sent', 'failed')).toBe(true)
    expect(shouldAdvanceStatus('failed', 'delivered')).toBe(false)
  })
})

describe('parseWebhook con smb_message_echoes (coexistencia)', () => {
  it('devuelve las respuestas enviadas desde el celular como ecos', () => {
    const { messages, echoes } = parseWebhook({
      entry: [
        {
          changes: [
            {
              field: 'smb_message_echoes',
              value: {
                metadata: { phone_number_id: '111' },
                message_echoes: [
                  { from: '573202107769', to: '573001234567', id: 'wamid.echo', timestamp: '1760000000', type: 'text', text: { body: 'Hola!' } },
                ],
              },
            },
          ],
        },
      ],
    })
    expect(messages).toHaveLength(0)
    expect(echoes[0]).toMatchObject({ waId: '573001234567', waMessageId: 'wamid.echo', type: 'text', body: 'Hola!' })
  })
})
