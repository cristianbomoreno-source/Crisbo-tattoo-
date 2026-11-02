import sharp from 'sharp'

/**
 * Nano Banana solo devuelve imágenes en ciertas proporciones (3:4, 2:3…): una
 * hoja carta (8,5 × 11) salía redondeada a 3:4 y el stencil ya no coincidía
 * con la imagen subida. Antes de dibujar se completa la imagen con blanco
 * hasta la proporción soportada más cercana y después se recorta ese mismo
 * borde del resultado: sale con la proporción exacta de lo que se subió.
 */
const RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const
export type AspectRatio = (typeof RATIOS)[number]

const value = (r: string) => {
  const [a, b] = r.split(':').map(Number) as [number, number]
  return a / b
}

/** Parte del resultado que corresponde a la imagen original, en fracciones del total. */
export type Crop = { left: number; top: number; width: number; height: number }

export async function fitToRatio(image: Uint8Array): Promise<{ image: Uint8Array; aspectRatio: AspectRatio; crop: Crop }> {
  const meta = await sharp(Buffer.from(image)).metadata()
  const w = meta.width ?? 1
  const h = meta.height ?? 1
  const r = w / h
  const aspectRatio = RATIOS.reduce((best, x) => (Math.abs(Math.log(value(x) / r)) < Math.abs(Math.log(value(best) / r)) ? x : best))
  const target = value(aspectRatio)
  // Se agrega blanco solo en un sentido: a los lados si la imagen es más angosta, arriba y abajo si es más ancha.
  const W = r < target ? Math.round(h * target) : w
  const H = r < target ? h : Math.round(w / target)
  const left = Math.floor((W - w) / 2)
  const top = Math.floor((H - h) / 2)
  const padded =
    W === w && H === h
      ? image
      : await sharp(Buffer.from(image))
          .extend({ left, right: W - w - left, top, bottom: H - h - top, background: '#ffffff' })
          .jpeg({ quality: 95 })
          .toBuffer()
  return { image: padded, aspectRatio, crop: { left: left / W, top: top / H, width: w / W, height: h / H } }
}

/** Quita del resultado el blanco que agregó `fitToRatio`. */
export async function cropBack(result: Uint8Array, crop: Crop): Promise<Uint8Array> {
  if (crop.width >= 0.999 && crop.height >= 0.999) return result
  const meta = await sharp(Buffer.from(result)).metadata()
  const W = meta.width ?? 1
  const H = meta.height ?? 1
  const left = Math.round(crop.left * W)
  const top = Math.round(crop.top * H)
  return sharp(Buffer.from(result))
    .extract({ left, top, width: Math.min(W - left, Math.round(crop.width * W)), height: Math.min(H - top, Math.round(crop.height * H)) })
    .png()
    .toBuffer()
}

/** ¿La imagen es tamaño carta (8,5 × 11, vertical u horizontal)? */
export function isLetter(width: number, height: number) {
  return Math.abs(Math.min(width, height) / Math.max(width, height) - 8.5 / 11) < 0.015
}
