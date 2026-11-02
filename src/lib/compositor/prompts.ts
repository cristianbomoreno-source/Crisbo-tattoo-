import { z } from 'zod'
import type { Elemento } from './store'

/**
 * Compositor (/dashboard/compositor): de la foto de un tatuaje ya hecho saca
 * un diseño plano y lo separa en capas (fondo + un elemento por capa) para
 * editarlo en Procreate. Tres pasos de IA:
 * 1. un modelo de visión identifica los elementos (león, flores, vela…);
 * 2. Nano Banana redibuja la referencia como diseño plano sobre blanco;
 * 3. Nano Banana marca la silueta (máscara) de cada elemento sobre ese diseño
 *    plano y la app corta los píxeles exactos: ninguna capa se redibuja, cada
 *    píxel queda en una sola capa y el fondo es lo que sobra.
 */

export type CompositorModelId = 'nano-banana' | 'nano-banana-pro'
export type CompositorSourceId = 'tatuaje' | 'diseno'

export const COMPOSITOR_SOURCES: { id: CompositorSourceId; label: string; hint: string }[] = [
  { id: 'tatuaje', label: 'Tatuaje en piel', hint: 'Foto de un tatuaje ya hecho' },
  { id: 'diseno', label: 'Diseño o dibujo', hint: 'Flash, boceto o imagen plana' },
]

export const isCompositorModel = (v: unknown): v is CompositorModelId => v === 'nano-banana' || v === 'nano-banana-pro'
export const isCompositorSource = (v: unknown): v is CompositorSourceId => v === 'tatuaje' || v === 'diseno'

export const Analisis = z.object({
  subject: z.string().describe('One sentence in English: what the tattoo depicts and its style (e.g. black and grey realism of a lion with roses and a lit candle).'),
  elementos: z
    .array(
      z.object({
        nombre: z
          .string()
          .describe('Short name in Spanish for the layer, 1 to 3 words, as a tattoo artist would call it (e.g. "León", "Flores", "Vela", "Reloj", "Mariposa").'),
        descripcion: z
          .string()
          .describe(
            'Precise description in English so an image editor can isolate exactly this element and nothing else: what it is, where it is in the image, its parts and what it overlaps or is overlapped by (e.g. "the lion head in the center, including its whole mane, eyes and nose; the roses overlap the lower part of the mane").',
          ),
      }),
    )
    .min(1)
    .max(6)
    .describe(
      'The main separable subjects of the design, ordered from the back (farthest) to the front (closest). Group small repeated things into one element (all the roses together as "Flores", all leaves together). 1 to 6 items. Do not include the background here.',
    ),
  fondo: z
    .string()
    .describe(
      'In English: what forms the background of the design behind the main elements (smoke, clouds, shading, dotwork, geometric patterns, sky, light rays…), or exactly "none" if there is no background beyond empty skin.',
    ),
})

export const ANALISIS_PROMPT =
  'You are an expert tattoo artist. This image is a tattoo reference. Identify the separate elements of the design so each one can go on its own layer in Procreate. Answer only with the requested fields.'

export function planoPrompt(source: CompositorSourceId, subject: string) {
  const from =
    source === 'tatuaje'
      ? 'This is a photo of a healed or fresh tattoo on skin (there may be skin texture, hair, redness, reflections, uneven light and body curvature).'
      : 'This is a tattoo design reference (flash, sketch or picture).'
  return [
    from,
    `It shows: ${subject}`,
    'Redraw it as the clean, flat tattoo design that an artist would have on paper before tattooing it:',
    '- exactly the same composition: the same elements in the same positions, proportions and sizes, and the same pose and expression of every figure;',
    '- the same line work, shading and colors as the tattoo (if it is black and grey keep it black and grey; if it has color keep the same colors);',
    '- remove the skin, skin texture, hair, redness, reflections, the body outline and anything that is not tattoo ink;',
    '- solid pure white (#FFFFFF) background, crisp clean edges, seen straight on;',
    '- do not add new elements, text, frames, borders or signatures, and do not duplicate or mirror anything.',
  ].join('\n')
}

/**
 * La IA no redibuja la capa: solo pinta la silueta del elemento. La app corta
 * después los píxeles exactos del diseño plano con esa silueta (lib/compositor/mask.ts).
 */
export function mascaraPrompt(el: Elemento, all: Elemento[], fondo: string) {
  const others = all.filter((e) => e.id !== el.id).map((e) => e.descripcion)
  if (fondo !== 'none') others.push(`the background (${fondo})`)
  return [
    'This is a flat tattoo design on white. Make a selection MASK of exactly one element, like a precise selection in Procreate or Photoshop.',
    `ELEMENT: ${el.descripcion}`,
    'Return an image with exactly the same size and framing, where:',
    '- every pixel that belongs to the element is solid pure black (#000000): its outline, its whole interior, its shading, highlights and all its small details, as one solid silhouette with no lines or holes inside;',
    `- every other pixel is solid pure white (#FFFFFF)${others.length ? `, including ${others.join('; ')}` : ''};`,
    '- where another element is in front of this one, that covering part is white (do not include it, do not complete what is hidden);',
    '- follow the real edge of the element precisely; no gray, no gradients, no outlines, no drawing, nothing else.',
  ].join('\n')
}
