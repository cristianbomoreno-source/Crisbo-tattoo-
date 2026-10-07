/** Normaliza un teléfono a solo dígitos con indicativo.
 * Heurística Colombia (igual que waLink): 10 dígitos → antepone 57.
 * Devuelve null si quedan menos de 10 dígitos. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return null
  if (digits.length === 10) return `57${digits}`
  return digits
}
