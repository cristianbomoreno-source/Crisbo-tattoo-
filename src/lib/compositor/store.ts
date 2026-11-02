import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Composiciones guardadas en el bucket privado `studio-private` (como los
 * stencils): `{studioId}/compositor/{id}/` guarda `meta.json` (los elementos
 * que encontró la IA), `fuente.jpg` (la referencia ya preparada), `plano.png`
 * (el diseño plano completo) y una `capa-{elemento}.png` transparente por cada
 * elemento y el fondo. Cada paso se guarda apenas termina: si la persona sale
 * de la app a mitad de camino, al volver retoma lo que falta.
 */
const BUCKET = 'studio-private'
const dir = (studioId: string, id?: string) => `${studioId}/compositor${id ? `/${id}` : ''}`
const SIGNED_TTL = 60 * 60 * 6

export type Elemento = { id: string; nombre: string; descripcion: string }

export type CompositionMeta = {
  id: string
  createdAt: string
  model: string
  source: string
  subject: string
  /** Qué es el fondo según la IA, o 'none'. */
  fondo: string
  /** Inventario del tatuaje en piel (prepareTattoo) para que el diseño plano no deje nada por fuera. */
  analisis: string | null
  elementos: Elemento[]
}

export type Composition = CompositionMeta & {
  fuenteUrl: string | null
  planoUrl: string | null
  /** URL firmada de cada capa ya hecha, por id de elemento ('fondo' incluido). */
  capas: Record<string, string>
}

export type CompositionSummary = { id: string; createdAt: string; thumbUrl: string | null }

export const FONDO: Elemento = { id: 'fondo', nombre: 'Fondo', descripcion: 'background' }

export const isCompositionId = (id: unknown): id is string => typeof id === 'string' && /^\d{13}$/.test(id)
export const isElementoId = (id: unknown): id is string => typeof id === 'string' && /^(fondo|e\d{1,2})$/.test(id)

export function newCompositionId() {
  return String(Date.now())
}

async function put(admin: SupabaseClient, path: string, data: Uint8Array | string, contentType: string) {
  const upload = () => admin.storage.from(BUCKET).upload(path, data, { upsert: true, contentType })
  let { error } = await upload()
  if (error && /not found/i.test(error.message)) {
    await admin.storage.createBucket(BUCKET, { public: false })
    ;({ error } = await upload())
  }
  if (error) throw new Error(error.message)
}

async function sign(admin: SupabaseClient, path: string) {
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL)
  return data?.signedUrl ?? null
}

export async function saveFile(admin: SupabaseClient, studioId: string, id: string, name: string, data: Uint8Array, contentType: string) {
  const path = `${dir(studioId, id)}/${name}`
  await put(admin, path, data, contentType)
  return sign(admin, path)
}

export async function saveMeta(admin: SupabaseClient, studioId: string, meta: CompositionMeta) {
  await put(admin, `${dir(studioId, meta.id)}/meta.json`, JSON.stringify(meta), 'application/json')
}

export async function readMeta(admin: SupabaseClient, studioId: string, id: string): Promise<CompositionMeta | null> {
  const { data } = await admin.storage.from(BUCKET).download(`${dir(studioId, id)}/meta.json`)
  if (!data) return null
  try {
    return JSON.parse(await data.text()) as CompositionMeta
  } catch {
    return null
  }
}

export async function readFile(admin: SupabaseClient, studioId: string, id: string, name: string): Promise<Uint8Array | null> {
  const { data } = await admin.storage.from(BUCKET).download(`${dir(studioId, id)}/${name}`)
  return data ? new Uint8Array(await data.arrayBuffer()) : null
}

export async function getComposition(admin: SupabaseClient, studioId: string, id: string): Promise<Composition | null> {
  const meta = await readMeta(admin, studioId, id)
  if (!meta) return null
  const { data: files } = await admin.storage.from(BUCKET).list(dir(studioId, id), { limit: 100 })
  const names = (files ?? []).map((f) => f.name).filter((n) => n.endsWith('.png') || n.endsWith('.jpg'))
  const { data: signed } = names.length
    ? await admin.storage.from(BUCKET).createSignedUrls(names.map((n) => `${dir(studioId, id)}/${n}`), SIGNED_TTL)
    : { data: [] }
  const url = new Map((signed ?? []).filter((s) => s.signedUrl && s.path).map((s) => [s.path!.split('/').pop()!, s.signedUrl as string]))
  const capas: Record<string, string> = {}
  for (const [name, u] of url) {
    const m = /^capa-(.+)\.png$/.exec(name)
    if (m?.[1]) capas[m[1]] = u
  }
  return { ...meta, fuenteUrl: url.get('fuente.jpg') ?? null, planoUrl: url.get('plano.png') ?? null, capas }
}

export async function listCompositions(admin: SupabaseClient, studioId: string, limit = 12): Promise<CompositionSummary[]> {
  const { data, error } = await admin.storage.from(BUCKET).list(dir(studioId), { limit: 100, sortBy: { column: 'name', order: 'desc' } })
  if (error || !data) return []
  const ids = data
    .map((f) => f.name)
    .filter(isCompositionId)
    .sort()
    .reverse()
    .slice(0, limit)
  if (!ids.length) return []
  const paths = ids.flatMap((id) => [`${dir(studioId, id)}/plano.png`, `${dir(studioId, id)}/fuente.jpg`])
  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrls(paths, SIGNED_TTL)
  const url = new Map((signed ?? []).filter((s) => s.signedUrl && s.path).map((s) => [s.path!, s.signedUrl as string]))
  return ids.map((id) => ({
    id,
    createdAt: new Date(Number(id)).toISOString(),
    thumbUrl: url.get(`${dir(studioId, id)}/plano.png`) ?? url.get(`${dir(studioId, id)}/fuente.jpg`) ?? null,
  }))
}

/** Borra las máscaras y capas de una composición (al rehacer el diseño plano ya no encajan). */
export async function clearLayers(admin: SupabaseClient, studioId: string, id: string) {
  const { data } = await admin.storage.from(BUCKET).list(dir(studioId, id), { limit: 100 })
  const paths = (data ?? []).filter((f) => /^(capa|mascara)-/.test(f.name)).map((f) => `${dir(studioId, id)}/${f.name}`)
  if (paths.length) await admin.storage.from(BUCKET).remove(paths)
}

export async function deleteComposition(admin: SupabaseClient, studioId: string, id: string) {
  const { data } = await admin.storage.from(BUCKET).list(dir(studioId, id), { limit: 100 })
  const paths = (data ?? []).map((f) => `${dir(studioId, id)}/${f.name}`)
  if (paths.length) await admin.storage.from(BUCKET).remove(paths)
}
