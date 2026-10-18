import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeWaPhone, phoneSuffixPattern } from './parse'
import { normalizeText } from './tattoo-keywords'

/**
 * Respuestas automáticas de WhatsApp Business ("Gracias por comunicarte con
 * C-LLANTAS…", "En este momento no estamos disponibles…"): las contesta un
 * negocio, no un cliente. Si llegan justo después de una plantilla nuestra
 * (campaña, bono), el contacto se borra de la BD (con respaldo) y el chat se
 * archiva sin notificar.
 */
const AUTO_REPLY_PATTERNS = [
  /\bgracias por (comunicarte|comunicarse|escribir|escribirnos|contactar|contactarnos|tu mensaje|su mensaje|tu interes|su interes)/,
  /\bno (estamos|me encuentro|estoy|nos encontramos) disponibles?\b/,
  /\b(te|le) (responderemos|respondere|contestaremos|atenderemos)\b/,
  /\b(responderemos|respondere) (tu|su) mensaje\b/,
  /\bhaznos saber (como|en que)\b/,
  /\ben (que|como) (podemos|te podemos|le podemos) (ayudar|servir)/,
  /\bmensaje automatico\b/,
  /\bhorario de atencion\b/,
  /\bfuera (de|del) (horario|oficina)\b/,
]

/** Ventana desde nuestra plantilla: los bots contestan en ~10 s. */
const AUTO_REPLY_WINDOW_MS = 60_000

export function looksAutomated(body: string | null | undefined) {
  if (!body) return false
  const text = normalizeText(body)
  return AUTO_REPLY_PATTERNS.some((re) => re.test(text))
}

/** true si el mensaje es una respuesta automática a una plantilla nuestra
 * enviada hace menos de un minuto. */
export async function isAutomatedReplyToTemplate(
  admin: SupabaseClient,
  m: { conversationId: string; type: string; body: string | null; timestamp: string }
) {
  if (m.type !== 'text' || !looksAutomated(m.body)) return false
  const { data } = await admin
    .from('wa_messages')
    .select('type, created_at')
    .eq('conversation_id', m.conversationId)
    .eq('direction', 'out')
    .lte('created_at', m.timestamp)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data || data.type !== 'template') return false
  return new Date(m.timestamp).getTime() - new Date(data.created_at as string).getTime() <= AUTO_REPLY_WINDOW_MS
}

/** Borra los clientes de ese número (con respaldo en clients_deleted_backup,
 * salvo si tienen proyectos, cotizaciones o consentimientos) y archiva el chat. */
export async function dropAutomatedResponder(
  admin: SupabaseClient,
  opts: { studioId: string; conversationId: string; waId: string; clientId: string | null }
) {
  const ids = new Set<string>(opts.clientId ? [opts.clientId] : [])
  const pattern = phoneSuffixPattern(opts.waId)
  if (pattern) {
    const { data } = await admin.from('clients').select('id, phone').eq('studio_id', opts.studioId).ilike('phone', pattern)
    for (const c of data ?? []) if (normalizeWaPhone(c.phone as string) === opts.waId) ids.add(c.id as string)
  }
  const used = new Set<string>()
  if (ids.size) {
    for (const table of ['projects', 'quotes', 'consents'] as const) {
      const { data } = await admin.from(table).select('client_id').in('client_id', [...ids])
      for (const r of data ?? []) used.add(r.client_id as string)
    }
  }
  const del = [...ids].filter((id) => !used.has(id))
  if (del.length) {
    const { data: clients } = await admin.from('clients').select('*').in('id', del)
    if (clients?.length) {
      const deleted_at = new Date().toISOString()
      const { error } = await admin.from('clients_deleted_backup').insert(clients.map((c) => ({ ...c, deleted_at })))
      if (!error) await admin.from('clients').delete().in('id', clients.map((c) => c.id as string))
      else console.error('[auto-reply] respaldo', error.message)
    }
  }
  await admin
    .from('wa_conversations')
    .update({ archived: true, unread_count: 0, lead_stage: 'perdido' })
    .eq('id', opts.conversationId)
  console.log(`[auto-reply] +${opts.waId}: ${del.length} cliente(s) borrado(s), chat archivado`)
}
