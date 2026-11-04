import { generateText, Output, type FilePart, type ImagePart, type TextPart } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { PERSONA } from './persona'
import type { AgentMessage, ModelReply } from './guard'

/** Con la llave del estudio va directo a Google; si no, por el AI Gateway.
 * Para probar otra IA solo se cambia esta línea. */
const MODEL = { google: 'gemini-3.5-flash', gateway: 'google/gemini-3.5-flash' }

const Reply = z.object({
  mensajes: z.array(z.string()).describe('Las burbujas de WhatsApp a enviar, en orden. De 1 a 3.'),
  pasarACrisbo: z.boolean().describe('true si Crisbo debe seguir este chat. El agente ya no contestará más ahí.'),
  motivo: z.string().nullable().describe('Si pasa el chat: en una línea, qué necesita Crisbo revisar. Si no, null.'),
  enviarUbicacion: z.boolean().describe('true si pidió la ubicación exacta.'),
})

export type AgentMedia = { type: string; bytes: Uint8Array; mime: string }

const LABELS: Record<string, string> = {
  image: '[foto]',
  audio: '[nota de voz]',
  video: '[video]',
  sticker: '[sticker]',
  document: '[documento]',
  location: '[ubicación]',
  form: '[formulario]',
  unsupported: '[mensaje que no se pudo leer]',
}

function line(m: AgentMessage) {
  const who = m.direction === 'in' ? 'Cliente' : 'Crisbo'
  const label = m.type === 'text' ? '' : `${LABELS[m.type] ?? `[${m.type}]`} `
  return `${who}: ${label}${m.body ?? ''}`.trim()
}

export function buildTranscript(messages: AgentMessage[]) {
  return messages.map(line).join('\n')
}

export async function writeReply(opts: {
  messages: AgentMessage[]
  media: AgentMedia[]
  knowledge: string
  contactName: string | null
  returningClient: boolean
}): Promise<ModelReply> {
  const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const system = [
    PERSONA,
    `INFORMACIÓN\n${opts.knowledge}`,
    `Hoy es ${today}. Nombre del contacto en WhatsApp: ${opts.contactName || 'desconocido'}.`,
    opts.returningClient ? 'Esta persona ya es cliente del estudio.' : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const content: (TextPart | ImagePart | FilePart)[] = [
    { type: 'text', text: `Conversación hasta ahora:\n${buildTranscript(opts.messages)}\n\nEscribe tu respuesta al cliente.` },
    ...opts.media.map((m) =>
      m.type === 'image'
        ? ({ type: 'image', image: m.bytes, mediaType: m.mime } as const)
        : ({ type: 'file', data: m.bytes, mediaType: m.mime } as const)
    ),
  ]

  const { output } = await generateText({
    model: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(MODEL.google) : MODEL.gateway,
    system,
    output: Output.object({ schema: Reply }),
    messages: [{ role: 'user', content }],
  })
  return output
}
