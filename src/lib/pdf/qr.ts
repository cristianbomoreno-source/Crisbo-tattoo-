import QRCode from 'qrcode'

/** QR como data URI PNG, generado en el momento (sin red, sin servicio
 * externo) — usable tanto en <Image> de react-pdf como en <img> de
 * next/og. `null` si no hay valor que codificar. */
export async function generateQr(value: string | null, lightColor = '#C8FF1A'): Promise<string | null> {
  if (!value) return null
  try {
    return await QRCode.toDataURL(value, {
      margin: 0,
      color: { dark: '#090909', light: lightColor },
      width: 240,
    })
  } catch {
    return null
  }
}
