import type { SupabaseClient } from '@supabase/supabase-js'
import { isModel, isStyle, type StencilModelId, type StencilStyleId } from './styles'

/**
 * Historial de stencils en el bucket privado `studio-private` (como
 * lib/marketing/store.ts): `{studioId}/stencils/{ts}__{estilo}__{modelo}.png`
 * es el resultado de la IA y el mismo nombre con `.src.jpg`, la imagen
 * original. Sin tablas nuevas; se lee con URLs firmadas.
 */
const BUCKET = 'studio-private'
const dir = (studioId: string) => `${studioId}/stencils`

export type StencilItem = {
  id: string
  style: StencilStyleId
  model: StencilModelId
  createdAt: string
  url: string
  srcUrl: string | null
}

export function stencilId(style: StencilStyleId, model: StencilModelId) {
  return `${Date.now()}__${style}__${model}`
}

function parseId(id: string): Pick<StencilItem, 'style' | 'model' | 'createdAt'> | null {
  const [ts, style, model] = id.split('__')
  if (!ts || !isStyle(style) || !isModel(model)) return null
  return { style, model, createdAt: new Date(Number(ts)).toISOString() }
}

export async function saveStencil(admin: SupabaseClient, studioId: string, id: string, result: Uint8Array, source: Uint8Array) {
  const put = (name: string, data: Uint8Array, contentType: string) =>
    admin.storage.from(BUCKET).upload(`${dir(studioId)}/${name}`, data, { upsert: true, contentType })
  let { error } = await put(`${id}.png`, result, 'image/png')
  if (error && /not found/i.test(error.message)) {
    await admin.storage.createBucket(BUCKET, { public: false })
    ;({ error } = await put(`${id}.png`, result, 'image/png'))
  }
  if (error) throw new Error(error.message)
  await put(`${id}.src.jpg`, source, 'image/jpeg')
}

export async function listStencils(admin: SupabaseClient, studioId: string, limit = 24): Promise<StencilItem[]> {
  const { data, error } = await admin.storage
    .from(BUCKET)
    .list(dir(studioId), { limit: limit * 2, sortBy: { column: 'name', order: 'desc' } })
  if (error || !data) return []
  const ids = data
    .map((f) => f.name)
    .filter((n) => n.endsWith('.png'))
    .map((n) => n.slice(0, -4))
    .filter((id) => parseId(id))
    .slice(0, limit)
  if (!ids.length) return []
  const paths = ids.flatMap((id) => [`${dir(studioId)}/${id}.png`, `${dir(studioId)}/${id}.src.jpg`])
  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 6)
  const urlOf = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]))
  return ids.flatMap((id) => {
    const url = urlOf.get(`${dir(studioId)}/${id}.png`)
    if (!url) return []
    return [{ id, ...parseId(id)!, url, srcUrl: urlOf.get(`${dir(studioId)}/${id}.src.jpg`) ?? null }]
  })
}

export async function deleteStencil(admin: SupabaseClient, studioId: string, id: string) {
  if (!parseId(id)) return
  await admin.storage.from(BUCKET).remove([`${dir(studioId)}/${id}.png`, `${dir(studioId)}/${id}.src.jpg`])
}
