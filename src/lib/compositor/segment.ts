import sharp from 'sharp'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

/**
 * Máscara de un elemento con la segmentación de Gemini: el modelo que solo lee
 * imágenes devuelve la caja y la silueta de cada objeto como JSON. Cuesta
 * centavos, frente a ~270 pesos de pedirle a Nano Banana que pinte la máscara.
 * Si no devuelve nada útil, la ruta cae al método con Nano Banana.
 */
const SEGMENT = { google: 'gemini-2.5-flash', gateway: 'google/gemini-2.5-flash' }

type Entry = { box_2d?: number[]; mask?: string; label?: string }

function parseEntries(text: string): Entry[] {
  const json = text.replace(/```(?:json)?/g, '').trim()
  const start = json.indexOf('[')
  const end = json.lastIndexOf(']')
  if (start < 0 || end < start) return []
  try {
    const list = JSON.parse(json.slice(start, end + 1)) as Entry[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** Devuelve la máscara binaria (1 = del elemento) del tamaño del diseño, o null si no sirve. */
export async function segmentElement(image: Uint8Array, width: number, height: number, description: string): Promise<Uint8Array | null> {
  const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(SEGMENT.google) : SEGMENT.gateway
  const { text } = await generateText({
    model,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image, mediaType: 'image/jpeg' },
          {
            type: 'text',
            text: `Give the segmentation masks for: ${description}. Only that element (all of its parts, if it is a group of several pieces give one entry per piece), nothing else. Output a JSON list of segmentation masks where each entry contains the 2D bounding box in the key "box_2d", the segmentation mask in key "mask", and the text label in the key "label".`,
          },
        ],
      },
    ],
  })

  const out = new Uint8Array(width * height)
  let area = 0
  for (const e of parseEntries(text)) {
    if (!e.box_2d || e.box_2d.length !== 4 || typeof e.mask !== 'string') continue
    const [y0, x0, y1, x1] = e.box_2d.map((v) => Math.max(0, Math.min(1000, v)) / 1000) as [number, number, number, number]
    const left = Math.floor(x0 * width)
    const top = Math.floor(y0 * height)
    const w = Math.ceil(x1 * width) - left
    const h = Math.ceil(y1 * height) - top
    if (w < 2 || h < 2) continue
    const b64 = e.mask.replace(/^data:image\/\w+;base64,/, '')
    let gray: Buffer
    try {
      gray = await sharp(Buffer.from(b64, 'base64')).grayscale().resize(w, h, { fit: 'fill' }).raw().toBuffer()
    } catch {
      continue
    }
    for (let y = 0; y < h && top + y < height; y++) {
      for (let x = 0; x < w && left + x < width; x++) {
        if (gray[y * w + x]! > 127) {
          const i = (top + y) * width + left + x
          if (!out[i]) area++
          out[i] = 1
        }
      }
    }
  }
  // Una silueta diminuta casi siempre es un error de la segmentación.
  return area >= width * height * 0.002 ? out : null
}
