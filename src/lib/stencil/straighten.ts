import sharp from 'sharp'
import { generateText, Output } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

/**
 * Los modelos que dibujan (Nano Banana) conservan la geometría de lo que
 * reciben: si el tatuaje viene en diagonal o comprimido por la postura del
 * brazo, el stencil sale igual aunque el prompt pida corregirlo. Por eso la
 * geometría la corrige la app: un modelo de visión barato ubica, mide y analiza
 * el tatuaje, y sharp gira, recorta y estira la foto antes de mandarla a dibujar.
 */
const VISION = { google: 'gemini-3.5-flash', gateway: 'google/gemini-3.5-flash' }

/** Ancho de cada margen lateral, relativo al ancho del tatuaje enderezado. */
const SIDE_MARGIN = 0.15

const Located = z.object({
  box: z
    .array(z.number().min(0).max(1000))
    .length(4)
    .describe('Bounding box of the whole tattoo as [ymin, xmin, ymax, xmax], normalized 0-1000.'),
  tilt: z
    .number()
    .min(-90)
    .max(90)
    .describe(
      "Degrees the design's 'up' direction is rotated clockwise from straight up in the photo, judged from the drawn subject (faces, heads and figures upright) or, if abstract, from the long axis of the limb. Up pointing to the upper-right is positive, to the upper-left is negative, 0 if already upright.",
    ),
})

const PROMPT =
  'This photo shows a tattoo on a body part. Find the whole tattoo (only the ink, not the whole arm) and tell how much the design is tilted. Answer only with the requested fields.'

async function locate(image: Uint8Array) {
  const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(VISION.google) : VISION.gateway
  const { output } = await generateText({
    model,
    output: Output.object({ schema: Located }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image, mediaType: 'image/jpeg' },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  })
  return output
}

/** Lo que un tatuador vería antes de calcar: el inventario completo y la perspectiva del brazo. */
const Analysis = z.object({
  subject: z
    .string()
    .describe('One sentence: what the tattoo depicts and its style (e.g. black and grey realism of a classical statue face with smoke and a candle).'),
  elements: z
    .array(z.string())
    .describe(
      'Exhaustive inventory of every element and important detail of the design, top to bottom, each with its position and its key internal details (e.g. "top center: gothic window tracery with a rosette flower", "center: female statue face looking up-left, closed eyelids, parted lips, wavy hair pulled back", "lower left: lit candle with dripping wax"). Include small ornaments, background patterns, smoke wisps and partially visible elements. 8 to 25 items.',
    ),
  foreshortening: z
    .number()
    .min(0)
    .max(0.45)
    .describe(
      'How much the design looks compressed along its vertical axis because the limb is raised or angled toward or away from the camera, as a fraction: 0 = seen straight on, 0.15 = looks 15% shorter than it really is. Judge from the proportions of faces and known shapes (a face that looks squashed vertically means compression).',
    ),
  hidden: z
    .string()
    .describe('Which elements continue beyond the edges of the photo or around the sides of the limb, out of view, and how they most likely continue.'),
})

const ANALYZE_PROMPT =
  'You are an expert tattoo artist preparing a stencil. This photo shows a tattoo on a limb, already cropped and rotated upright. Study it carefully and describe it so another artist could redraw it without missing anything. Answer only with the requested fields.'

async function analyze(image: Uint8Array) {
  const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(VISION.google) : VISION.gateway
  const { output } = await generateText({
    model,
    output: Output.object({ schema: Analysis }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image, mediaType: 'image/jpeg' },
          { type: 'text', text: ANALYZE_PROMPT },
        ],
      },
    ],
  })
  return output
}

function analysisText(a: z.infer<typeof Analysis>): string {
  return [
    'Analysis of this tattoo by an expert artist (the photo is the authority for exact shapes; use this to understand the design and to make sure nothing is left out):',
    `- Subject: ${a.subject}`,
    '- Elements, every one of them must appear in the stencil with its details:',
    ...a.elements.map((e) => `  - ${e}`),
    `- Continues out of view: ${a.hidden}`,
  ].join('\n')
}

export type PreparedTattoo = { image: Uint8Array; analysis: string | null }

/**
 * Prepara la foto de un tatuaje en piel antes de dibujar, como lo haría un tatuador:
 * 1. la endereza (el modelo que dibuja no gira la imagen);
 * 2. vuelve a ubicar el tatuaje ya derecho y lo recorta (un brazo en diagonal
 *    ocupa casi toda la foto: recortar antes de girar no quita la pared);
 * 3. lo analiza: inventario de elementos y cuánto lo comprime la postura del
 *    brazo; esa compresión se corrige estirando la foto;
 * 4. le abre márgenes a los lados para lo que da la vuelta al brazo.
 * Si algo falla, sigue con lo que alcanzó a preparar.
 */
export async function prepareTattoo(image: Uint8Array): Promise<PreparedTattoo> {
  let cropped: Uint8Array
  try {
    let found = await locate(image)
    let upright = image
    const tilt = Math.round(found.tilt)
    if (Math.abs(tilt) >= 4) {
      upright = await sharp(Buffer.from(image)).rotate(-tilt, { background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer()
      found = await locate(upright)
    }
    const meta = await sharp(Buffer.from(upright)).metadata()
    const w = meta.width ?? 0
    const h = meta.height ?? 0
    if (!w || !h) return { image, analysis: null }
    const [ymin, xmin, ymax, xmax] = found.box.map((v) => v / 1000) as [number, number, number, number]
    const pad = 0.03
    const left = Math.max(0, Math.floor((xmin - pad) * w))
    const top = Math.max(0, Math.floor((ymin - pad) * h))
    const right = Math.min(w, Math.ceil((xmax + pad) * w))
    const bottom = Math.min(h, Math.ceil((ymax + pad) * h))
    const box = { left, top, width: right - left, height: bottom - top }
    // Una caja absurda (casi nada) no vale la pena.
    if (box.width < w * 0.1 || box.height < h * 0.1) return { image, analysis: null }
    cropped = await sharp(Buffer.from(upright)).extract(box).jpeg({ quality: 92 }).toBuffer()
    console.info('[stencil] enderezado', { tilt, box })
  } catch (e) {
    console.warn('[stencil] no se pudo enderezar', (e as Error).message)
    return { image, analysis: null }
  }

  let analysis: string | null = null
  let prepared = cropped
  try {
    const a = await analyze(cropped)
    analysis = analysisText(a)
    // Postura del brazo: lo que se ve comprimido a lo largo del brazo se estira a su proporción real.
    const f = Math.min(0.35, a.foreshortening)
    if (f >= 0.05) {
      const meta = await sharp(Buffer.from(cropped)).metadata()
      prepared = await sharp(Buffer.from(cropped))
        .resize(meta.width, Math.round((meta.height ?? 0) / (1 - f)), { fit: 'fill' })
        .jpeg({ quality: 92 })
        .toBuffer()
    }
    console.info('[stencil] analizado', { foreshortening: f, elements: a.elements.length })
  } catch (e) {
    console.warn('[stencil] no se pudo analizar', (e as Error).message)
  }

  // Márgenes blancos a los lados: ahí la IA dibuja la parte del diseño que da la vuelta al brazo y no sale en la foto.
  const width = (await sharp(Buffer.from(prepared)).metadata()).width ?? 0
  const side = Math.round(width * SIDE_MARGIN)
  const withMargins = await sharp(Buffer.from(prepared)).extend({ left: side, right: side, background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer()
  return { image: withMargins, analysis }
}
