/**
 * Convierte la imagen gris que devuelve la IA en línea pura: lo oscuro pasa
 * a ser tinta del color escogido y lo claro, blanco o transparente. El borde
 * entre los dos es suave (`softness`) para que la línea no quede serruchada
 * al ampliar para imprimir. Trabaja sobre los píxeles RGBA de un canvas.
 */
export type InkOptions = {
  /** Color de la línea, "#rrggbb". */
  color: string
  /** Fondo transparente (PNG solo líneas) en vez de blanco. */
  transparent: boolean
  /** 0–255: más alto = entran trazos más claros (más detalle, más ruido). */
  threshold: number
  softness?: number
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  const n = m ? parseInt(m[1]!, 16) : 0
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Cuánta tinta (0–1) lleva un píxel de luminancia `lum`. */
export function inkAmount(lum: number, threshold: number, softness = 24): number {
  const half = softness / 2
  if (lum <= threshold - half) return 1
  if (lum >= threshold + half) return 0
  return (threshold + half - lum) / softness
}

export function applyInk(data: Uint8ClampedArray, { color, transparent, threshold, softness = 24 }: InkOptions) {
  const [r, g, b] = hexToRgb(color)
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]! / 255
    // Lo transparente cuenta como blanco.
    const lum = (0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) * a + 255 * (1 - a)
    const ink = inkAmount(lum, threshold, softness)
    if (transparent) {
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = Math.round(ink * 255)
    } else {
      data[i] = Math.round(255 - (255 - r) * ink)
      data[i + 1] = Math.round(255 - (255 - g) * ink)
      data[i + 2] = Math.round(255 - (255 - b) * ink)
      data[i + 3] = 255
    }
  }
  return data
}
