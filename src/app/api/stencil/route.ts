import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { generateImage, generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { STENCIL_MODELS, isModel, isStyle, stencilPrompt } from '@/lib/stencil/styles'
import { deleteStencil, listStencils, saveStencil, stencilId } from '@/lib/stencil/store'

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
    const result = await generateText({
      model: model.gateway,
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

export async function POST(req: Request) {
  const sid = await studioId()
  if (!sid) return fail('Inicia sesión', 401)

  const form = await req.formData().catch(() => null)
  const file = form?.get('image')
  const style = form?.get('style')
  const model = form?.get('model') ?? 'nano-banana'
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

  let raw: Uint8Array
  try {
    raw = await runModel(model, stencilPrompt(style), source)
  } catch (e) {
    console.error('[stencil]', model, (e as Error).message)
    return fail('La IA no pudo crear el stencil. Intenta de nuevo o cambia de modelo.', 502)
  }

  // Escala de grises y contraste al máximo; el color y la transparencia los pone el navegador.
  const png = await sharp(Buffer.from(raw)).flatten({ background: '#ffffff' }).grayscale().normalise().png().toBuffer()

  const id = stencilId(style, model)
  try {
    await saveStencil(createAdminClient(), sid, id, png, source)
  } catch (e) {
    console.error('[stencil] guardar', (e as Error).message)
  }
  return NextResponse.json({ id, image: `data:image/png;base64,${png.toString('base64')}` })
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
