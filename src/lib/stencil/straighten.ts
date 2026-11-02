import sharp from 'sharp'
import { generateText, Output } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

/**
 * Los modelos que dibujan (Nano Banana) conservan la posición de lo que
 * reciben: si el tatuaje viene en diagonal sobre el brazo, el stencil sale en
 * diagonal aunque el prompt pida enderezarlo. Por eso el enderezado lo hace la
 * app: un modelo de visión barato ubica el tatuaje y su inclinación, y sharp
 * recorta y gira la foto antes de mandarla a dibujar.
 */
const VISION = { google: 'gemini-3.5-flash', gateway: 'google/gemini-3.5-flash' }

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

/** Corta al tatuaje (con margen) y lo deja vertical. Si algo falla, devuelve la foto tal cual. */
export async function straightenTattoo(image: Uint8Array): Promise<Uint8Array> {
  try {
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
    const meta = await sharp(Buffer.from(image)).metadata()
    const w = meta.width ?? 0
    const h = meta.height ?? 0
    if (!w || !h) return image

    const [ymin, xmin, ymax, xmax] = output.box.map((v) => v / 1000) as [number, number, number, number]
    const pad = 0.04
    const left = Math.max(0, Math.floor((xmin - pad) * w))
    const top = Math.max(0, Math.floor((ymin - pad) * h))
    const right = Math.min(w, Math.ceil((xmax + pad) * w))
    const bottom = Math.min(h, Math.ceil((ymax + pad) * h))
    const box = { left, top, width: right - left, height: bottom - top }
    // Una caja absurda (casi nada o casi toda la foto sin inclinación) no vale la pena.
    if (box.width < w * 0.1 || box.height < h * 0.1) return image

    let img = sharp(Buffer.from(image)).extract(box)
    if (Math.abs(output.tilt) >= 4) img = sharp(await img.toBuffer()).rotate(-output.tilt, { background: '#ffffff' })
    console.info('[stencil] enderezado', { tilt: Math.round(output.tilt), box })
    return await img.jpeg({ quality: 92 }).toBuffer()
  } catch (e) {
    console.warn('[stencil] no se pudo enderezar', (e as Error).message)
    return image
  }
}
