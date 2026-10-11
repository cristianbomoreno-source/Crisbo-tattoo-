import { describe, expect, it } from 'vitest'
import { formAnswersText, formFlowJson, parseFormResponse } from './data-form'
import { parseWebhook } from './parse'

describe('formFlowJson', () => {
  it('pide los cuatro datos y los devuelve en el payload de complete', () => {
    const screen = formFlowJson().screens[0]!
    const json = JSON.stringify(screen)
    for (const field of ['nombre', 'celular', 'correo', 'nacimiento']) {
      expect(json).toContain(`"name":"${field}"`)
      expect(json).toContain(`"${field}":"\${form.${field}}"`)
    }
    expect(screen.terminal).toBe(true)
  })
})

describe('parseFormResponse', () => {
  it('lee las respuestas del Flow', () => {
    const a = parseFormResponse(
      JSON.stringify({
        flow_token: 'abc',
        nombre: ' Ana María Pérez ',
        celular: '300 123 4567',
        correo: 'Ana@Mail.com',
        nacimiento: '1995-04-20',
      })
    )
    expect(a).toEqual({ nombre: 'Ana María Pérez', celular: '300 123 4567', correo: 'ana@mail.com', nacimiento: '1995-04-20' })
    expect(formAnswersText(a!)).toContain('Fecha de nacimiento: 1995-04-20')
  })
  it('convierte fechas en epoch ms', () => {
    expect(parseFormResponse(JSON.stringify({ nacimiento: String(Date.UTC(2000, 0, 15)) }))?.nacimiento).toBe('2000-01-15')
  })
  it('ignora JSON inválido o de otro Flow', () => {
    expect(parseFormResponse('no-json')).toBeNull()
    expect(parseFormResponse(JSON.stringify({ flow_token: 'x', otra: 1 }))).toBeNull()
    expect(parseFormResponse(null)).toBeNull()
  })
})

describe('parseWebhook con nfm_reply', () => {
  it('marca la respuesta del Flow como type form', () => {
    const { messages } = parseWebhook({
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                metadata: { phone_number_id: '111' },
                contacts: [{ wa_id: '573001234567', profile: { name: 'Ana' } }],
                messages: [
                  {
                    from: '573001234567',
                    id: 'wamid.1',
                    timestamp: '1760000000',
                    type: 'interactive',
                    interactive: {
                      type: 'nfm_reply',
                      nfm_reply: { name: 'flow', body: 'Sent', response_json: '{"nombre":"Ana"}' },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    })
    expect(messages[0]).toMatchObject({ type: 'form', body: null, flowResponse: '{"nombre":"Ana"}' })
  })
})
