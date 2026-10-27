/**
 * Opciones del CRM de Mensajes. Se guardan en columnas que ya existían en
 * `clients` y no se usaban:
 *  - origen  → `clients.source`
 *  - etiquetas → `clients.preferred_services` (text[])
 *  - notas   → `clients.notes`
 * El motivo de un lead perdido se guarda como etiqueta "Perdido · <motivo>".
 */

export const LEAD_SOURCES = ['Instagram', 'WhatsApp', 'Anuncio', 'Referido', 'Google', 'Pasó por el estudio', 'Otro'] as const

export const SUGGESTED_TAGS = [
  'Realismo',
  'Fine line',
  'Blackwork',
  'Color',
  'Lettering',
  'Cover up',
  'Primera vez',
  'VIP',
  'Menor de edad',
] as const

export const LOST_REASONS = ['Precio', 'No respondió', 'Se fue con otro', 'Fecha', 'Menor de edad', 'Otro'] as const

export const LOST_TAG_PREFIX = 'Perdido · '

export function lostTag(reason: string) {
  return `${LOST_TAG_PREFIX}${reason}`
}

/** Etiquetas sin las de "Perdido · …" (esas se muestran aparte). */
export function visibleTags(tags: string[] | null | undefined) {
  return (tags ?? []).filter((t) => !t.startsWith(LOST_TAG_PREFIX))
}

export function lostReason(tags: string[] | null | undefined) {
  const t = (tags ?? []).find((x) => x.startsWith(LOST_TAG_PREFIX))
  return t ? t.slice(LOST_TAG_PREFIX.length) : null
}

/** Origen del lead: el guardado en el cliente, o el canal del chat. */
export function leadSource(source: string | null | undefined, channel: 'whatsapp' | 'instagram') {
  return source?.trim() || (channel === 'instagram' ? 'Instagram' : 'WhatsApp')
}

/** Normaliza una lista de etiquetas: sin vacías, sin repetidas (ignora mayúsculas), máx. 12. */
export function cleanTags(tags: string[]) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const t = raw.trim().slice(0, 30)
    const k = t.toLowerCase()
    if (!t || seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out.slice(0, 12)
}
