/** Coordenadas a partir de un enlace de Google Maps (o de cualquier texto que
 * las contenga). Prioriza el pin del lugar (`!3d…!4d…`) sobre el centro del
 * mapa (`@lat,lng`). Los enlaces cortos (maps.app.goo.gl) no traen
 * coordenadas: hay que seguir la redirección antes (`resolveMapsCoords`). */
export function extractCoords(text: string): { latitude: number; longitude: number } | null {
  let decoded = text
  try {
    decoded = decodeURIComponent(text)
  } catch {
    // texto con % sueltos: se usa tal cual
  }
  const patterns = [
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
    /^\s*(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)\s*$/,
  ]
  for (const re of patterns) {
    const m = decoded.match(re)
    if (!m) continue
    const latitude = Number(m[1])
    const longitude = Number(m[2])
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return { latitude, longitude }
  }
  return null
}

/** Sigue las redirecciones del enlace (hasta 5) buscando coordenadas. */
export async function resolveMapsCoords(url: string) {
  const direct = extractCoords(url)
  if (direct) return direct
  let current = url
  for (let i = 0; i < 5; i++) {
    const res = await fetch(current, { redirect: 'manual', cache: 'no-store' })
    const next = res.headers.get('location')
    if (!next) {
      // Sin más redirecciones: a veces las coordenadas vienen en el HTML.
      const html = await res.text().catch(() => '')
      return extractCoords(html.slice(0, 200_000))
    }
    current = new URL(next, current).toString()
    const found = extractCoords(current)
    if (found) return found
  }
  return null
}

/** Mismo formato que el texto de una ubicación entrante (`parse.ts`). */
export function locationText(name: string, address: string | null, latitude: number, longitude: number) {
  const label = [name, address].filter(Boolean).join(' — ')
  return `${label}\nhttps://maps.google.com/?q=${latitude},${longitude}`
}
