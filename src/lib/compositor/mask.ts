/**
 * Recorte exacto de capas: la IA solo marca la silueta de cada elemento
 * (máscara negro sobre blanco) y la app corta los píxeles del diseño plano
 * con esa máscara. Así ninguna capa se redibuja y cada píxel queda en una sola
 * capa: el elemento de adelante gana donde dos máscaras se pisan, y el fondo
 * es lo que no reclamó ningún elemento.
 */

/** Máscara binaria (1 = del elemento) a partir de un canal gris de la IA: negro = elemento. */
export function maskFromGray(gray: Uint8Array, threshold = 128): Uint8Array {
  const out = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) out[i] = gray[i]! < threshold ? 1 : 0
  return out
}

/** Erosión con ventana cuadrada (2r+1): queda 1 solo donde toda la ventana es 1. */
export function erode(mask: Uint8Array, width: number, height: number, r: number): Uint8Array {
  if (r <= 0) return mask.slice()
  const span = 2 * r + 1
  const horiz = new Uint8Array(mask.length)
  const runs = new Int32Array(Math.max(width, height))
  for (let y = 0; y < height; y++) {
    let run = 0
    for (let x = 0; x < width; x++) runs[x] = run = mask[y * width + x] ? run + 1 : 0
    for (let x = 0; x < width; x++) {
      // Fuera de la imagen cuenta como 1 para no comerse los bordes.
      const end = Math.min(width - 1, x + r)
      const need = Math.min(span, end + 1, end - Math.max(0, x - r) + 1)
      if (runs[end]! >= need) horiz[y * width + x] = 1
    }
  }
  const out = new Uint8Array(mask.length)
  for (let x = 0; x < width; x++) {
    let run = 0
    for (let y = 0; y < height; y++) runs[y] = run = horiz[y * width + x] ? run + 1 : 0
    for (let y = 0; y < height; y++) {
      const end = Math.min(height - 1, y + r)
      const need = Math.min(span, end + 1, end - Math.max(0, y - r) + 1)
      if (runs[end]! >= need) out[y * width + x] = 1
    }
  }
  return out
}

const invert = (m: Uint8Array) => m.map((v) => (v ? 0 : 1))

export const dilate = (mask: Uint8Array, width: number, height: number, r: number) => invert(erode(invert(mask), width, height, r))

/**
 * Limpia la máscara que dibujó la IA: cierra huequitos dentro de la silueta y
 * la agranda un poco para que el contorno del dibujo (y su borde suavizado)
 * quede dentro de la capa y no en la de al lado.
 */
export function cleanMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const r = Math.max(2, Math.round(Math.max(width, height) / 600))
  const closed = erode(dilate(mask, width, height, r), width, height, r)
  return dilate(closed, width, height, r)
}

/**
 * Reparte los píxeles del diseño plano entre las capas. `masks` va del elemento
 * de atrás al de adelante (null = todavía no tiene máscara). Devuelve una
 * imagen RGBA por elemento y una para el fondo (lo que nadie reclamó); lo que
 * no es de la capa queda blanco y transparente.
 */
export function splitLayers(plano: Uint8Array, width: number, height: number, masks: (Uint8Array | null)[]) {
  const n = width * height
  const claimed = new Uint8Array(n)
  const layers: (Uint8Array | null)[] = masks.map(() => null)
  for (let k = masks.length - 1; k >= 0; k--) {
    const m = masks[k]
    if (!m) continue
    const out = new Uint8Array(n * 4).fill(255)
    for (let i = 0; i < n; i++) {
      if (m[i] && !claimed[i]) {
        claimed[i] = 1
        copyPixel(plano, out, i)
      } else out[i * 4 + 3] = 0
    }
    layers[k] = out
  }
  const fondo = new Uint8Array(n * 4).fill(255)
  for (let i = 0; i < n; i++) {
    if (!claimed[i]) copyPixel(plano, fondo, i)
    else fondo[i * 4 + 3] = 0
  }
  return { layers, fondo }
}

function copyPixel(src: Uint8Array, dst: Uint8Array, i: number) {
  const p = i * 4
  dst[p] = src[p]!
  dst[p + 1] = src[p + 1]!
  dst[p + 2] = src[p + 2]!
  dst[p + 3] = 255
}
