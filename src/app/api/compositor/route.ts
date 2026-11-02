import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { generateText, Output } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { STENCIL_MODELS } from '@/lib/stencil/styles'
import { prepareTattoo } from '@/lib/stencil/straighten'
import { whiteToAlpha } from '@/lib/compositor/alpha'
import { ANALISIS_PROMPT, Analisis, capaPrompt, fondoPrompt, isCompositorModel, isCompositorSource, planoPrompt } from '@/lib/compositor/prompts'
import {
  FONDO,
  deleteComposition,
  getComposition,
  isCompositionId,
  isElementoId,
  listCompositions,
  newCompositionId,
  readFile,
  readMeta,
  saveFile,
  saveMeta,
  type CompositionMeta,
  type Elemento,
} from '@/lib/compositor/store'

// Cada paso es un pedido aparte (analizar, diseño plano, una capa) y cada uno tarda menos de 2 min.
export const maxDuration = 300

const MAX_BYTES = 4 * 1024 * 1024
const VISION = { google: 'gemini-3.5-flash', gateway: 'google/gemini-3.5-flash' }

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
  console.warn('[compositor]', status, message)
  return NextResponse.json({ error: message }, { status })
}

function aiError(e: unknown) {
  const msg = (e as Error).message
  console.error('[compositor]', msg)
  if (/free tier|credits|insufficient|balance|billing|quota|exhausted/i.test(msg))
    return fail(process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Falta saldo de IA: activa la facturación de tu llave en Google AI Studio.' : 'Falta saldo de IA: recarga créditos en Vercel → AI Gateway.', 402)
  return fail('La IA no pudo terminar este paso. Intenta de nuevo o cambia de modelo.', 502)
}

/** Nano Banana (o Pro) edita la imagen que recibe y devuelve otra a 2K. */
async function draw(modelId: string, prompt: string, image: Uint8Array): Promise<Uint8Array> {
  const model = STENCIL_MODELS.find((m) => m.id === modelId)!
  const direct = model.google && process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(model.google) : null
  const result = await generateText({
    model: direct ?? model.gateway,
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

const toJpeg = (img: Uint8Array) => sharp(Buffer.from(img)).flatten({ background: '#ffffff' }).jpeg({ quality: 95 }).toBuffer()

/** Lista de elementos que manda el navegador después de que la persona la revisa. */
function parseElementos(raw: FormDataEntryValue | null, current: Elemento[]): Elemento[] | null {
  if (typeof raw !== 'string') return null
  try {
    const list = JSON.parse(raw) as { id?: string; nombre?: string }[]
    const out: Elemento[] = []
    for (const item of list.slice(0, 6)) {
      const nombre = String(item.nombre ?? '').trim().slice(0, 40)
      if (!nombre) continue
      const prev = current.find((e) => e.id === item.id)
      // Un elemento que la persona agregó o renombró se describe con su nombre.
      const descripcion = prev && prev.nombre === nombre ? prev.descripcion : `the ${nombre} (name given by the artist in Spanish)`
      out.push({ id: `e${out.length + 1}`, nombre, descripcion })
    }
    return out.length ? out : null
  } catch {
    return null
  }
}

async function analizar(sid: string, form: FormData) {
  const file = form.get('image')
  const kind = form.get('source')
  const model = form.get('model') ?? 'nano-banana'
  if (!(file instanceof Blob) || !file.size) return fail('Sube una imagen', 400)
  if (file.size > MAX_BYTES) return fail('La imagen pesa más de 4 MB', 400)
  if (!isCompositorSource(kind)) return fail('Tipo de imagen inválido', 400)
  if (!isCompositorModel(model)) return fail('Modelo inválido', 400)

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
  // Tatuaje en piel: se endereza, se recorta y se corrige la postura del brazo, sin márgenes extra.
  let analisis: string | null = null
  if (kind === 'tatuaje') ({ image: source, analysis: analisis } = await prepareTattoo(source, 0))

  let found
  try {
    const { output } = await generateText({
      model: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(VISION.google) : VISION.gateway,
      output: Output.object({ schema: Analisis }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: source, mediaType: 'image/jpeg' },
            { type: 'text', text: ANALISIS_PROMPT },
          ],
        },
      ],
    })
    found = output
  } catch (e) {
    return aiError(e)
  }

  const admin = createAdminClient()
  const meta: CompositionMeta = {
    id: newCompositionId(),
    createdAt: new Date().toISOString(),
    model,
    source: kind,
    subject: found.subject,
    fondo: found.fondo.trim() || 'none',
    analisis,
    elementos: found.elementos.map((e, i) => ({ id: `e${i + 1}`, nombre: e.nombre.trim(), descripcion: e.descripcion })),
  }
  await saveFile(admin, sid, meta.id, 'fuente.jpg', source, 'image/jpeg')
  await saveMeta(admin, sid, meta)
  return NextResponse.json({ composition: await getComposition(admin, sid, meta.id) })
}

async function plano(sid: string, form: FormData) {
  const id = form.get('id')
  if (!isCompositionId(id)) return fail('Composición inválida', 400)
  const admin = createAdminClient()
  const meta = await readMeta(admin, sid, id)
  const fuente = meta && (await readFile(admin, sid, id, 'fuente.jpg'))
  if (!meta || !fuente) return fail('No encontré esa composición', 404)

  // La persona pudo quitar, renombrar o agregar elementos antes de crear las capas.
  const elementos = parseElementos(form.get('elementos'), meta.elementos)
  if (elementos) meta.elementos = elementos
  if (form.get('fondo') === '0') meta.fondo = 'none'
  const model = form.get('model')
  if (isCompositorModel(model)) meta.model = model
  await saveMeta(admin, sid, meta)

  let raw: Uint8Array
  try {
    const prompt = planoPrompt(meta.source === 'tatuaje' ? 'tatuaje' : 'diseno', meta.subject)
    raw = await draw(meta.model, meta.analisis ? `${prompt}\n${meta.analisis}` : prompt, fuente)
  } catch (e) {
    return aiError(e)
  }
  const png = await sharp(Buffer.from(raw)).flatten({ background: '#ffffff' }).png().toBuffer()
  const url = await saveFile(admin, sid, id, 'plano.png', png, 'image/png')
  return NextResponse.json({ planoUrl: url, composition: await getComposition(admin, sid, id) })
}

async function capa(sid: string, form: FormData) {
  const id = form.get('id')
  const capaId = form.get('capa')
  if (!isCompositionId(id) || !isElementoId(capaId)) return fail('Capa inválida', 400)
  const admin = createAdminClient()
  const meta = await readMeta(admin, sid, id)
  const planoPng = meta && (await readFile(admin, sid, id, 'plano.png'))
  if (!meta || !planoPng) return fail('Primero hay que crear el diseño plano', 409)
  const el = capaId === 'fondo' ? FONDO : meta.elementos.find((e) => e.id === capaId)
  if (!el) return fail('Ese elemento ya no está en la lista', 404)

  const { width, height } = await sharp(Buffer.from(planoPng)).metadata()
  let raw: Uint8Array
  try {
    const prompt = el.id === 'fondo' ? fondoPrompt(meta.elementos, meta.fondo) : capaPrompt(el, meta.elementos, meta.fondo)
    raw = await draw(meta.model, prompt, await toJpeg(planoPng))
  } catch (e) {
    return aiError(e)
  }
  // Mismo tamaño que el diseño plano para que las capas encajen una encima de otra; el blanco de alrededor queda transparente.
  const rgba = await sharp(Buffer.from(raw))
    .flatten({ background: '#ffffff' })
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  whiteToAlpha(rgba.data, rgba.info.width, rgba.info.height)
  const png = await sharp(rgba.data, { raw: { width: rgba.info.width, height: rgba.info.height, channels: 4 } }).png().toBuffer()
  const url = await saveFile(admin, sid, id, `capa-${el.id}.png`, png, 'image/png')
  return NextResponse.json({ capa: el.id, url })
}

export async function POST(req: Request) {
  const sid = await studioId()
  if (!sid) return fail('Inicia sesión', 401)
  const form = await req.formData().catch(() => null)
  if (!form) return fail('Pedido inválido', 400)
  const paso = form.get('paso')
  if (paso === 'analizar') return analizar(sid, form)
  if (paso === 'plano') return plano(sid, form)
  if (paso === 'capa') return capa(sid, form)
  return fail('Paso inválido', 400)
}

export async function GET(req: Request) {
  const sid = await studioId()
  if (!sid) return fail('Inicia sesión', 401)
  const id = new URL(req.url).searchParams.get('id')
  const admin = createAdminClient()
  if (id) {
    if (!isCompositionId(id)) return fail('Composición inválida', 400)
    const composition = await getComposition(admin, sid, id)
    return composition ? NextResponse.json({ composition }) : fail('No encontré esa composición', 404)
  }
  return NextResponse.json({ items: await listCompositions(admin, sid) })
}

export async function DELETE(req: Request) {
  const sid = await studioId()
  if (!sid) return fail('Inicia sesión', 401)
  const id = new URL(req.url).searchParams.get('id')
  if (isCompositionId(id)) await deleteComposition(createAdminClient(), sid, id)
  return NextResponse.json({ ok: true })
}
