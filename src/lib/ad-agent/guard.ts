import { normalizeText } from '@/lib/whatsapp-cloud/tattoo-keywords'

/**
 * Reglas del agente de la pauta, sin I/O. La marca de cada mensaje va en
 * `wa_messages.media_filename` (no se usa en textos y evita tocar el esquema):
 *  - entrante `ad:<id>` = vino de un anuncio (referral de Meta)
 *  - saliente `ai-agent` = lo escribió el agente; `ai-agent:handoff` = además
 *    pasó el chat a Crisbo y el agente no vuelve a contestar ahí.
 */
export const AD_MARK = 'ad:'
export const AGENT_MARK = 'ai-agent'
export const HANDOFF_MARK = 'ai-agent:handoff'

/** Tope por chat: si no ha cerrado con esto, mejor que siga una persona. */
export const MAX_AGENT_MESSAGES = 14

/** Texto precargado de los anuncios: respaldo si Meta no manda el referral. */
const AD_PHRASES = [/\bcupo de noviembre\b/]

export const isAgentMessage = (m: { media_filename: string | null }) => !!m.media_filename?.startsWith(AGENT_MARK)

export type AgentMessage = {
  direction: 'in' | 'out'
  type: string
  body: string | null
  media_filename: string | null
  created_at: string
}

export function isAdMessage(m: AgentMessage) {
  if (m.direction !== 'in') return false
  if (m.media_filename?.startsWith(AD_MARK)) return true
  const text = normalizeText(m.body ?? '')
  return AD_PHRASES.some((re) => re.test(text))
}

export type Decision = { act: true; adIndex: number } | { act: false; reason: string; handoff?: boolean }

/** ¿Le toca contestar al agente? Ante la duda no contesta: cualquier mensaje
 * saliente que no sea suyo después del anuncio (Crisbo desde el celular, la
 * bandeja, una plantilla) significa que el chat ya tiene dueño. */
export function decide(messages: AgentMessage[], enabledAt: string): Decision {
  const adIndex = messages.findIndex((m) => isAdMessage(m) && m.created_at >= enabledAt)
  if (adIndex === -1) return { act: false, reason: 'not-ad' }
  const after = messages.slice(adIndex)
  const out = after.filter((m) => m.direction === 'out')
  if (out.some((m) => !isAgentMessage(m))) return { act: false, reason: 'human' }
  if (out.some((m) => m.media_filename === HANDOFF_MARK)) return { act: false, reason: 'handed-off' }
  const last = after.at(-1)!
  if (last.direction !== 'in') return { act: false, reason: 'answered' }
  const lastOut = after.findLastIndex((m) => m.direction === 'out')
  if (after.slice(lastOut + 1).every((m) => m.type === 'reaction')) return { act: false, reason: 'reaction' }
  if (out.length >= MAX_AGENT_MESSAGES) return { act: false, reason: 'limit', handoff: true }
  return { act: true, adIndex }
}

/** Montos escritos en un texto, en pesos: "470.000", "1100000", "$94,000",
 * "470 mil", "1.1 millones", "500k". No confunde llaves ni teléfonos (9 o más
 * dígitos seguidos) con un precio. */
export function amountsIn(text: string): number[] {
  const found: number[] = []
  const t = text.toLowerCase()
  for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:millones|millón|millon|palos?)\b/g)) {
    found.push(Math.round(Number(m[1]!.replace(',', '.')) * 1_000_000))
  }
  for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:mil\b|k\b|lucas\b)/g)) {
    found.push(Math.round(Number(m[1]!.replace(',', '.')) * 1_000))
  }
  for (const m of t.matchAll(/(?<![\d@])\d{1,3}(?:[.,]\d{3})+(?!\d)|(?<![\d@])\d{5,8}(?!\d)/g)) {
    found.push(Number(m[0].replace(/[.,]/g, '')))
  }
  return found
}

/** Lo que el agente puede decir: las cifras escritas en la información del
 * estudio, y el 20% de cada una (el abono). */
export function allowedAmounts(knowledge: string) {
  const base = amountsIn(knowledge)
  return new Set([...base, ...base.map((n) => Math.round(n * 0.2))])
}

export type ModelReply = { mensajes: string[]; pasarACrisbo: boolean; motivo: string | null; enviarUbicacion: boolean }
export type CheckedReply = { bubbles: string[]; handoff: boolean; reason: string | null; location: boolean }

const FALLBACK = 'Dame un momento y ya te confirmo'

/** Revisa la respuesta antes de enviarla. Si trae un valor que no está en la
 * información del estudio no sale: el cliente recibe un mensaje de espera y el
 * chat pasa a Crisbo. */
export function checkReply(reply: ModelReply, knowledge: string): CheckedReply {
  const bubbles = reply.mensajes
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 3)
  const allowed = allowedAmounts(knowledge)
  const invented = bubbles.flatMap(amountsIn).find((n) => !allowed.has(n))
  if (invented !== undefined) {
    return { bubbles: [FALLBACK], handoff: true, reason: `El agente iba a decir un valor no autorizado (${invented})`, location: false }
  }
  if (bubbles.length === 0) {
    return { bubbles: [FALLBACK], handoff: true, reason: reply.motivo || 'El agente no supo qué responder', location: false }
  }
  return { bubbles, handoff: reply.pasarACrisbo, reason: reply.pasarACrisbo ? reply.motivo || 'Revisar este chat' : null, location: reply.enviarUbicacion }
}
