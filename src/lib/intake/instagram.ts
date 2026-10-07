/** Sanea el handle/URL de Instagram del estudio hacia una URL abrible.
 * Acepta "@handle", "handle", "instagram.com/handle", "www.instagram.com/handle"
 * o una URL https/http ya armada (se devuelve tal cual, sin duplicar dominio). */
export function instagramUrl(handle: string | null | undefined): string | null {
  if (!handle) return null
  const trimmed = handle.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const withoutDomain = trimmed.replace(/^(www\.)?instagram\.com\//i, '')
  const clean = withoutDomain
    .replace(/^@/, '')
    .replace(/\s+/g, '')
    .replace(/\/+$/, '')
  return clean ? `https://instagram.com/${clean}` : null
}

/** Handle limpio para MOSTRAR ("usuario", sin @): acepta las mismas formas que
 * instagramUrl. Devuelve null si no se reduce a un handle (ej. una URL ajena
 * con path) — mejor omitir la línea que imprimir "@https://…" en un documento. */
export function instagramHandle(handle: string | null | undefined): string | null {
  if (!handle) return null
  const clean = handle
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\s+/g, '')
    .replace(/\/+$/, '')
  if (!clean || clean.includes('/')) return null
  return clean
}
