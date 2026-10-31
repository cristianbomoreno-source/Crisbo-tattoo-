/**
 * Generador de stencils (/dashboard/stencil): la IA convierte un diseño o la
 * foto de un tatuaje en líneas negras sobre blanco; el navegador después lo
 * deja en línea pura del color escogido, con o sin fondo (stencil-canvas.ts).
 * Los modelos pasan por el AI Gateway de Vercel (en producción se autentica
 * solo con OIDC, sin llaves).
 */

export type StencilStyleId = 'contorno' | 'linea-fina' | 'detalle' | 'mapa-tonal' | 'linea-gruesa'
export type StencilModelId = 'nano-banana' | 'seedream' | 'gpt-image'

export const STENCIL_STYLES: { id: StencilStyleId; label: string; hint: string; prompt: string }[] = [
  {
    id: 'detalle',
    label: 'Detalle',
    hint: 'Líneas y textura en trazos: pelo, plumas, escamas',
    prompt:
      'Detailed stencil: trace every outline plus the internal detail lines. Render texture (hair, fur, feathers, scales, wrinkles) as individual flowing strokes that follow the direction of the form. Shadows become a few strokes along their edges, never filled areas.',
  },
  {
    id: 'contorno',
    label: 'Contorno',
    hint: 'Solo el contorno principal, sin detalles',
    prompt:
      'Outline-only stencil: trace only the outer silhouette of each element and its main internal shapes. No texture, no hair strokes, no shading marks.',
  },
  {
    id: 'linea-fina',
    label: 'Línea fina',
    hint: 'Contorno y detalles finos, líneas delgadas',
    prompt:
      'Fine-line stencil: thin, delicate, uniform lines. Trace outlines and the important small details (eyes, facial features, ornaments) with minimal texture strokes.',
  },
  {
    id: 'mapa-tonal',
    label: 'Mapa tonal',
    hint: 'Para realismo: marca dónde va cada sombra',
    prompt:
      'Tonal-map stencil for realism tattoos: trace all outlines and features, and add thin contour lines that map the borders between light, mid-tone and dark areas, like a topographic map of the shadows. Mark the darkest areas with sparse parallel hatching. Never fill areas solid.',
  },
  {
    id: 'linea-gruesa',
    label: 'Línea gruesa',
    hint: 'Líneas fuertes estilo tradicional',
    prompt:
      'Bold-line stencil: thick, confident, uniform lines like traditional tattoo linework. Simplify tiny details into clear shapes. Keep the main inner details as bold lines.',
  },
]

export const STENCIL_MODELS: { id: StencilModelId; label: string; hint: string; gateway: string; google?: string; kind: 'language' | 'image' }[] = [
  { id: 'nano-banana', label: 'Nano Banana', hint: 'Google · fiel y rápido', gateway: 'google/gemini-3.1-flash-image', google: 'gemini-3.1-flash-image-preview', kind: 'language' },
  { id: 'seedream', label: 'Seedream', hint: 'Líneas limpias · más lento', gateway: 'bytedance/seedream-5.0-pro', kind: 'image' },
  { id: 'gpt-image', label: 'GPT Image', hint: 'OpenAI · trazo nítido', gateway: 'openai/gpt-image-2', kind: 'image' },
]

const BASE = `Convert this image into a professional tattoo transfer stencil (thermal stencil line art).
Rules:
- Pure black lines on a pure white background. No gray, no solid fills, no gradients, no color, no shading.
- Trace ONLY the tattoo design. If the image is a photo of a tattoo on skin, trace only the inked design: ignore the skin, the outline of the arm or body, clothing, fabric, the background, reflections and lighting.
- Keep the composition, proportions and every element exactly as in the original. Do not add, invent, remove or restyle anything. Do not add text, signatures or borders.
- The design fills the frame, centered, with a small white margin.
- Clean, continuous lines and closed shapes. No noise, no stray dots, no smudges.`

export function stencilPrompt(style: StencilStyleId): string {
  const s = STENCIL_STYLES.find((x) => x.id === style) ?? STENCIL_STYLES[0]!
  return `${BASE}\nStyle: ${s.prompt}`
}

export const isStyle = (v: unknown): v is StencilStyleId => STENCIL_STYLES.some((s) => s.id === v)
export const isModel = (v: unknown): v is StencilModelId => STENCIL_MODELS.some((m) => m.id === v)
