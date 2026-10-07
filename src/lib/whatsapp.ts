/** Construye un enlace wa.me con el teléfono del cliente y un mensaje.
 * Devuelve null si no hay teléfono. Heurística Colombia: 10 dígitos → +57. */
export function waLink(
  phone: string | null | undefined,
  text: string
): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) digits = `57${digits}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
