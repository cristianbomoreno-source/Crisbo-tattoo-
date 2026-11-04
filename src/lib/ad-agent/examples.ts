import type { SupabaseClient } from '@supabase/supabase-js'
import { isTattooInquiry, normalizeText } from '@/lib/whatsapp-cloud/tattoo-keywords'
import { AGENT_MARK } from './guard'

/**
 * Lo que el agente aprende de los chats reales de Crisbo: antes de contestar
 * busca respuestas suyas a mensajes parecidos. Solo chats de tatuajes: quedan
 * fuera los personales y los de amigos. Los valores viejos se tapan (el precio
 * sale siempre de la información del estudio), igual que teléfonos y correos.
 */

export type ExampleRow = {
  conversation_id: string
  direction: 'in' | 'out'
  type: string
  body: string | null
  media_filename: string | null
  created_at: string
}

const MAX_EXAMPLES = 12
const HISTORY_DAYS = 60
const PAGES = 3
const PAGE_SIZE = 1000

const CASUAL = /\b(mk|hpta?|hp|gonorrea|marica|pirobo|verg\w*|perro|papi|papito|nene|gordo)\b/
const AUTOMATED = /^[¡📝🔔🎁]|cita qued|recomendaciones importantes|Confirmamos tu pago/
const STOP = new Set(['hola', 'para', 'como', 'esta', 'este', 'esto', 'pero', 'porque', 'tengo', 'quiero', 'buenas', 'gracias', 'sería', 'seria'])

function words(text: string) {
  return new Set(normalizeText(text).split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 4 && !STOP.has(w)))
}

export function redact(text: string) {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[correo]')
    .replace(/\$?\d{1,3}(?:[.,]\d{3})+|\b\d{5,}\b/g, '[valor]')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:mil|millones|millón)\b/gi, '[valor]')
}

type Pair = { client: string; reply: string; at: string; score: number }

/** `rows` en orden cronológico. */
export function buildExamples(rows: ExampleRow[], query: string, excluded: Set<string>) {
  const byChat = new Map<string, ExampleRow[]>()
  for (const r of rows) {
    if (excluded.has(r.conversation_id)) continue
    byChat.set(r.conversation_id, [...(byChat.get(r.conversation_id) ?? []), r])
  }

  const wanted = words(query)
  const pairs: Pair[] = []
  for (const messages of byChat.values()) {
    const mine = messages.filter((m) => m.direction === 'out' && !m.media_filename?.startsWith(AGENT_MARK))
    if (mine.some((m) => CASUAL.test(normalizeText(m.body ?? '')))) continue
    if (!messages.some((m) => m.direction === 'in' && isTattooInquiry(m.body))) continue

    for (let i = 0; i < messages.length - 1; i++) {
      const asked = messages[i]!
      const answer = messages[i + 1]!
      if (asked.direction !== 'in' || answer.direction !== 'out') continue
      if (asked.type !== 'text' || answer.type !== 'text' || !asked.body || !answer.body) continue
      if (answer.media_filename?.startsWith(AGENT_MARK) || answer.body.length > 220 || AUTOMATED.test(answer.body)) continue
      const score = [...words(asked.body)].filter((w) => wanted.has(w)).length
      pairs.push({ client: redact(asked.body).slice(0, 200), reply: redact(answer.body), at: answer.created_at, score })
    }
  }

  const seen = new Set<string>()
  return pairs
    .sort((a, b) => b.score - a.score || b.at.localeCompare(a.at))
    .filter((p) => (seen.has(p.reply) ? false : !!seen.add(p.reply)))
    .slice(0, MAX_EXAMPLES)
    .map((p) => `Cliente: ${p.client}\nTú: ${p.reply}`)
    .join('\n\n')
}

/** Trae paginado: Supabase corta cada consulta en 1.000 filas. */
export async function loadExampleRows(admin: SupabaseClient, studioId: string) {
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString()
  const rows: ExampleRow[] = []
  for (let page = 0; page < PAGES; page++) {
    const { data, error } = await admin
      .from('wa_messages')
      .select('conversation_id, direction, type, body, media_filename, created_at')
      .eq('studio_id', studioId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...((data ?? []) as ExampleRow[]))
    if ((data ?? []).length < PAGE_SIZE) break
  }
  return rows.reverse()
}
