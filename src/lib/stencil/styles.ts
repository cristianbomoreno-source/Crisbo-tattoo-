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
    // El id se queda 'mapa-tonal' para no romper el historial guardado.
    id: 'mapa-tonal',
    label: 'Mapa de sombras',
    hint: 'Para realismo: contorno de negros, medios y luces',
    prompt:
      'Shadow-map stencil for realism tattoos: trace all outlines and features with a fine uniform line, then map the shading of the reference in three zones, marking only the border of each zone, never filling it: (1) solid black areas: enclose them with a continuous line; (2) mid-tone areas: enclose them with a continuous line; (3) highlight areas: enclose them with a dashed line. All marks use the same line color and weight. No hatching, no stippling, no fills, and never label the zones with text, numbers, letters or symbols.',
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

export type StencilSourceId = 'tatuaje' | 'referencia' | 'dibujo'

export const STENCIL_SOURCES: { id: StencilSourceId; label: string; hint: string }[] = [
  { id: 'tatuaje', label: 'Tatuaje en piel', hint: 'Foto de un tatuaje ya hecho' },
  { id: 'referencia', label: 'Foto de referencia', hint: 'Persona, animal u objeto real' },
  { id: 'dibujo', label: 'Dibujo', hint: 'Diseño en papel o digital' },
]

const BASE = `Convert this image into a professional tattoo transfer stencil (thermal stencil line art).
Rules:
- Pure black lines on a pure white background. No gray, no solid fills, no gradients, no color, no shading, no skin or photographic texture.
- Never fill any area with black or dark ink, not even the areas that are solid black in the original: outline them with a line instead. The result is line work only, mostly white.
- Do not add text, numbers, labels, symbols, signatures or borders.
- The subject fills the frame, centered, with a small white margin.
- Clean, continuous lines and closed shapes. No noise, no stray dots, no smudges. Clean, precise and legible, ready to use as a tattoo base.`

/** Foto de un tatuaje ya hecho: solo la tinta, nunca la piel ni el cuerpo. */
const TATTOO = `- This is a photo of a tattoo on skin. Trace only the inked design: ignore the skin, the outline of the arm or body, clothing, fabric, the background, reflections and lighting.`

const FAITHFUL = `- Keep the composition, proportions and every element exactly as in the original. Do not add, invent, remove or restyle anything.`

/**
 * Foto de un tatuaje en piel → diseño plano, como si estuviera dibujado en una hoja.
 * Solo completa lo que la foto no deja ver; nunca reinterpreta el diseño (un
 * tigre estilizado sin ojos sigue sin ojos).
 */
const FLATTEN = `- The tattoo was photographed on a curved limb, so the photo only shows its front: the design keeps going around the sides of the limb, out of view. The photo you receive has already been cropped and straightened, and narrow white margins were added on the left and right: they are room for the part of the design that wraps around the limb. They do not have to be filled: leave them empty wherever nothing reaches them. Rebuild the whole tattoo as the original flat drawing on a sheet of paper, seen straight from the front, upright.
- The edge of the limb (where the skin ends against the background, clothing or the white margins) is NOT part of the design: never draw a line along it, and never trace the outline of a dark background fill where it runs into that edge. Wherever the design touches the edge of the limb, it continues past it into the white margins: extend the drapery, hair, clouds, smoke, cracks, background patterns and any figure or element that is cut off by the edge, in the same style and with the same line weight, only as far as needed for each element to close naturally (a short distance, never a new scene). Unwrap the curvature so the parts that bend toward the sides get their real width back.
- Only continue what is already started in the visible tattoo. Never add new objects, figures, body parts, symbols, frames or props that do not appear in it.
- Every element appears exactly once. NEVER repeat, mirror, clone or duplicate a face, figure or any other element of the design, not even to fill the margins or to make the composition look balanced.
- Inside the visible area, the tattoo is the absolute reference: every element keeps its position, size and angle relative to the other elements, its pose, expression and style. Do NOT reinterpret, redraw, "correct" or make it more realistic or anatomically complete. Stylized, abstract, partial or unusual features are intentional: if a feature (eyes, nose, a hand, a face) is not drawn in the tattoo, it must NOT appear in the stencil. Lines hidden by glare, blur or shadow are completed following the strokes next to them.
- Small elements that ARE in the tattoo (small figures, faces, hands, ornaments) must be traced complete and sharp, with their real features clearly defined, at the same level of care as the main subject: never blur, merge or reduce them to scribbles.`

/**
 * Segunda pasada del modo "hoja plana": sobre el stencil ya hecho (sin foto ni
 * piel), quitar las rectas del borde del brazo que quedaron y unir lo que cortan.
 * En la foto el borde es un corte muy marcado y el modelo lo calca aunque se le
 * diga que no; sobre un dibujo limpio sí lo resuelve.
 */
export const COMPLETE_PROMPT = `This is a tattoo stencil (black line art on white) traced from a photo of a tattoo on a forearm. Edit it:
- Remove every long straight or slightly curved line that runs along the full height of the design and cuts through it: those are the edges of the arm, not part of the tattoo. Also remove any hard vertical cut where elements stop abruptly.
- Where those lines cut the design, join the two sides so every element flows continuously across: drapery, hair, clouds, smoke, cracks, ornaments and background shapes continue smoothly from one side to the other.
- Where a removed line cut through a figure, finish that same figure's limb, hand or drapery right at the cut, following its pose, proportions and style. Do not extend or complete anything else.
- Keep everything else exactly as it is: same elements, positions, line weight and style. Do not add new figures, body parts or objects, never repeat, mirror or duplicate a face or figure, do not fill areas with black, do not add text.
- Output: the same stencil, pure black lines on pure white, complete and continuous.`

/** Foto real (retrato, animal, objeto) que se va a tatuar en realismo: calco técnico fiel. */
const REFERENCE = `- This is a reference photograph to be tattooed. Make a maximum-fidelity technical trace: an exact line trace perfectly matched to the original, keeping the scale, tilt, perspective and placement of every element. No artistic reinterpretation: never invent elements or change the anatomy, expression or composition.
- Include: the overall silhouette; the exact facial features and expression; the important wrinkles and folds of the face and neck; ears, earrings and accessories; hands with a clear anatomical structure; clothing with its essential folds; the main objects complete and well defined; the internal details useful for tattooing, simplifying only those that create visual noise.
- Exclude or reduce to a minimum: the whole background, blur, atmosphere, stains, noise, micro-textures and irrelevant excess detail.`

/** Dibujo en papel o digital: calco exacto, sin la textura del papel. */
const DRAWING = `- This is a drawing or a digital design. Trace it exactly: same lines, proportions and composition. Ignore the paper texture and color, pencil smudges, eraser marks, guide lines, shadows on the paper and the photo perspective of the sheet.`

/** Solo diseños geométricos u ornamentales: nunca caras, animales ni figuras. */
const SYMMETRY = `- If the design is geometric or ornamental and clearly meant to be symmetric (mandala, sacred geometry, ornament, a centered emblem or frame), make it perfectly symmetric: mirror the best-drawn side, equalize repeated elements and their spacing, make circles and concentric rings perfect. Never apply symmetry to faces, animals, people, figures or organic compositions: leave those exactly as drawn.`

export type StencilOptions = { source?: StencilSourceId; flatten?: boolean; symmetry?: boolean }

export function stencilPrompt(style: StencilStyleId, opts: StencilOptions = {}): string {
  const s = STENCIL_STYLES.find((x) => x.id === style) ?? STENCIL_STYLES[0]!
  const rules =
    opts.source === 'referencia'
      ? [BASE, REFERENCE]
      : opts.source === 'dibujo'
        ? [BASE, DRAWING, FAITHFUL, opts.symmetry ? SYMMETRY : null]
        : [BASE, TATTOO, opts.flatten ? FLATTEN : FAITHFUL, opts.symmetry ? SYMMETRY : null]
  return `${rules.filter(Boolean).join('\n')}\nStyle: ${s.prompt}`
}

export const isSource = (v: unknown): v is StencilSourceId => STENCIL_SOURCES.some((s) => s.id === v)
export const isStyle = (v: unknown): v is StencilStyleId => STENCIL_STYLES.some((s) => s.id === v)
export const isModel = (v: unknown): v is StencilModelId => STENCIL_MODELS.some((m) => m.id === v)
