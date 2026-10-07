/** Satori (next/og) revienta la generación COMPLETA si una sola <img> no
 * carga (URL rota, bucket privado, timeout) — no la salta, tumba toda la
 * imagen. Se valida cada URL remota ANTES de pasarla al render; la que
 * falla se descarta en silencio en vez de romper la pieza entera. */
export async function safeImageUrl(url: string | null, timeoutMs = 4000): Promise<string | null> {
  if (!url) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timer)
    return res.ok ? url : null
  } catch {
    return null
  }
}
