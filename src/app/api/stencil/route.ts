import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { generateImage, generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { COMPLETE_PROMPT, STENCIL_MODELS, isModel, isSource, isStyle, stencilPrompt } from '@/lib/stencil/styles'
import { deleteStencil, listStencils, readStencil, saveStencil, stencilId } from '@/lib/stencil/store'
import { prepareTattoo } from '@/lib/stencil/straighten'
import { hollowFills } from '@/lib/stencil/hollow'
import { hasArmEdgeLines } from '@/lib/stencil/edges'

// Seedream puede tardar ~3 min.
export const maxDuration = 300

const MAX_BYTES = 4 * 1024 * 1024

async function studioId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const studio = await getCurrentStudio()
  return studio?.id ?? null
}

const fail = (message: string, status: number) => {
  console.warn('[stencil]', status, message)
  return NextResponse.json({ error: message }, { status })
}

async function runModel(modelId: string, prompt: string, image: Uint8Array): Promise<Uint8Array> {
  const model = STENCIL_MODELS.find((m) => m.id === modelId)!
  if (model.kind === 'language') {
    // Con llave propia de Google (GOOGLE_GENERATIVE_AI_API_KEY en Vercel),
    // Nano Banana va directo a Gemini y no gasta saldo del AI Gateway.
    const direct = model.google && process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(model.google) : null
    const result = await generateText({
      model: direct ?? model.gateway,
      // Sin esto Gemini dibuja a 1K y se pierden las caras pequeñas y los ornamentos finos.
      providerOptions: { google: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { imageSize: '2K' } } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image, mediaType: 'image/jpeg' },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })
    const file = result.files.find((f) => f.mediaType.startsWith('image/'))
    if (!file) throw new Error('La IA no devolvió imagen')
    return file.uint8Array
  }
  const { image: out } = await generateImage({ model: model.gateway, prompt: { text: prompt, images: [image] } })
  return out.uint8Array
}

function aiFail(model: string, e: unknown) {
  const msg = (e as Error).message
  console.error('[stencil]', model, msg)
  if (/free tier|credits|insufficient|balance|billing|quota|exhausted/i.test(msg))
    return fail(process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Falta saldo de IA: activa la facturación de tu llave en Google AI Studio.' : 'Falta saldo de IA: recarga créditos en Vercel → AI Gateway.', 402)
  return fail('La IA no pudo crear el stencil. Intenta de nuevo o cambia de modelo.', 502)
}

const toGray = (img: Uint8Array) => sharp(Buffer.from(img)).flatten({ background: '#ffffff' }).grayscale().normalise().raw().toBuffer({ resolveWithObject: true })

/** Segunda pasada sobre el dibujo limpio: quita el borde del brazo y une lo que corta. */
async function removeArmLines(model: string, raw: Uint8Array) {
  const drawn = await sharp(Buffer.from(raw)).flatten({ background: '#ffffff' }).jpeg({ quality: 95 }).toBuffer()
  return runModel(model, COMPLETE_PROMPT, drawn)
}

/** Escala de grises, contraste al máximo y sin masas negras; el color y la transparencia los pone el navegador. */
async function finish(raw: Uint8Array) {
  const gray = await toGray(raw)
  const { width, height } = gray.info
  hollowFills(gray.data, width, height, Math.max(4, Math.round(Math.max(width, height) / 300)))
  return sharp(gray.data, { raw: { width, height, channels: 1 } }).png().toBuffer()
}

/**
 * "Quitar líneas del brazo" sobre un stencil ya hecho: si alguna línea se le
 * escapó al detector, la persona pide solo la segunda pasada (una imagen) en
 * vez de rehacer todo. Se guarda como un stencil nuevo con la misma foto.
 */
async function fixStencil(sid: string, fixId: string) {
  const admin = createAdminClient()
  const saved = await readStencil(admin, sid, fixId)
  if (!saved) return fail('No encontré ese stencil', 404)
  let raw: Uint8Array
  try {
    raw = await removeArmLines(saved.model, saved.result)
  } catch (e) {
    return aiFail(saved.model, e)
  }
  const png = await finish(raw)
  const id = stencilId(saved.style, saved.model)
  const source = saved.source ?? (await sharp(Buffer.from(saved.result)).jpeg().toBuffer())
  try {
    await saveStencil(admin, sid, id, png, source)
  } catch (e) {
    console.error('[stencil] guardar', (e as Error).message)
  }
  return NextResponse.json({ id, image: `data:image/png;base64,${png.toString('base64')}`, src: `data:image/jpeg;base64,${Buffer.from(source).toString('base64')}` })
}

export async function POST(req: Request) {
  const sid = await studioId()
  if (!sid) return fail('Inicia sesión', 401)

  const form = await req.formData().catch(() => null)
  const fixId = form?.get('fix')
  if (typeof fixId === 'string' && fixId) return fixStencil(sid, fixId)
  const file = form?.get('image')
  const style = form?.get('style')
  const model = form?.get('model') ?? 'nano-banana'
  const kind = form?.get('source')
  const opts = { source: isSource(kind) ? kind : undefined, flatten: form?.get('flatten') === '1', symmetry: form?.get('symmetry') === '1' }
  if (!(file instanceof Blob) || !file.size) return fail('Sube una imagen', 400)
  if (file.size > MAX_BYTES) return fail('La imagen pesa más de 4 MB', 400)
  if (!isStyle(style)) return fail('Estilo inválido', 400)
  if (!isModel(model)) return fail('Modelo inválido', 400)

  // JPEG derecho y de máximo 2048 px: lo que mejor reciben los modelos.
  let source: Uint8Array
  try {
    source = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 92 })
      .toBuffer()
  } catch {
    return fail('No se pudo leer la imagen', 400)
  }
  // Tatuaje en piel para aplanar: la app lo endereza, recorta, analiza y corrige la postura del brazo antes de dibujar.
  const flattening = opts.source !== 'referencia' && opts.source !== 'dibujo' && opts.flatten
  let analysis: string | null = null
  if (flattening) ({ image: source, analysis } = await prepareTattoo(source))

  let raw: Uint8Array
  try {
    const prompt = stencilPrompt(style, opts)
    raw = await runModel(model, analysis ? `${prompt}\n${analysis}` : prompt, source)
    // Hoja plana: segunda pasada (otra imagen de IA) solo si quedaron líneas del borde del brazo.
    if (flattening) {
      const first = await toGray(raw)
      const lines = hasArmEdgeLines(first.data, first.info.width, first.info.height)
      console.info('[stencil] segunda pasada', lines ? 'sí: líneas del brazo' : 'no hizo falta')
      if (lines) raw = await removeArmLines(model, raw)
    }
  } catch (e) {
    return aiFail(model, e)
  }

  const png = await finish(raw)
  const id = stencilId(style, model)
  try {
    await saveStencil(createAdminClient(), sid, id, png, source)
  } catch (e) {
    console.error('[stencil] guardar', (e as Error).message)
  }
  return NextResponse.json({ id, image: `data:image/png;base64,${png.toString('base64')}`, src: `data:image/jpeg;base64,${Buffer.from(source).toString('base64')}` })
}

export async function GET() {
  const sid = await studioId()
  if (!sid) return fail('Inicia sesión', 401)
  return NextResponse.json({ items: await listStencils(createAdminClient(), sid) })
}

export async function DELETE(req: Request) {
  const sid = await studioId()
  if (!sid) return fail('Inicia sesión', 401)
  const id = new URL(req.url).searchParams.get('id')
  if (id) await deleteStencil(createAdminClient(), sid, id)
  return NextResponse.json({ ok: true })
}
