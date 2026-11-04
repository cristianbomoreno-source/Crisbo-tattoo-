import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_KNOWLEDGE } from './persona'
import type { StoredChatMode } from './guard'

/** Ajustes del agente de la pauta: JSON en el bucket privado, igual que
 * lib/social/store.ts, para no tocar el esquema. */

const BUCKET = 'studio-private'
const settingsPath = (studioId: string) => `${studioId}/ad-agent.json`
const lockPath = (studioId: string) => `${studioId}/ad-agent.lock`
const chatsPath = (studioId: string) => `${studioId}/ad-agent-chats.json`

/** Un cron que muera sin soltar el candado no frena al agente más de esto. */
const LOCK_TTL_MS = 3 * 60_000

export type AdAgentSettings = {
  enabled: boolean
  /** Solo se atienden anuncios que entren después de esta fecha. */
  enabledAt: string | null
  /** Oferta, precios y datos del estudio. */
  knowledge: string
}

export async function loadAdAgentSettings(admin: SupabaseClient, studioId: string): Promise<AdAgentSettings> {
  const empty: AdAgentSettings = { enabled: false, enabledAt: null, knowledge: DEFAULT_KNOWLEDGE }
  const { data, error } = await admin.storage.from(BUCKET).download(settingsPath(studioId))
  if (error || !data) return empty
  try {
    return { ...empty, ...(JSON.parse(await data.text()) as Partial<AdAgentSettings>) }
  } catch {
    return empty
  }
}

export async function saveAdAgentSettings(admin: SupabaseClient, studioId: string, settings: AdAgentSettings) {
  const body = new Blob([JSON.stringify(settings)], { type: 'application/json' })
  let { error } = await admin.storage.from(BUCKET).upload(settingsPath(studioId), body, { upsert: true, contentType: 'application/json' })
  if (error && /not found/i.test(error.message)) {
    await admin.storage.createBucket(BUCKET, { public: false })
    ;({ error } = await admin.storage.from(BUCKET).upload(settingsPath(studioId), body, { upsert: true, contentType: 'application/json' }))
  }
  if (error) throw new Error(error.message)
}

/** Quién contesta cada chat: { conversationId: modo }. */
export async function loadChatModes(admin: SupabaseClient, studioId: string): Promise<Record<string, StoredChatMode>> {
  const { data, error } = await admin.storage.from(BUCKET).download(chatsPath(studioId))
  if (error || !data) return {}
  try {
    return JSON.parse(await data.text()) as Record<string, StoredChatMode>
  } catch {
    return {}
  }
}

export async function saveChatModes(admin: SupabaseClient, studioId: string, changes: Record<string, StoredChatMode>) {
  if (Object.keys(changes).length === 0) return
  const merged = { ...(await loadChatModes(admin, studioId)), ...changes }
  const body = new Blob([JSON.stringify(merged)], { type: 'application/json' })
  const { error } = await admin.storage.from(BUCKET).upload(chatsPath(studioId), body, { upsert: true, contentType: 'application/json' })
  if (error) throw new Error(error.message)
}

/** El cron corre cada minuto y una vuelta puede tardar más: subir el archivo
 * sin `upsert` falla si ya existe, y eso evita contestar dos veces un chat. */
export async function acquireAdAgentLock(admin: SupabaseClient, studioId: string) {
  const store = admin.storage.from(BUCKET)
  const body = new Blob([JSON.stringify({ at: Date.now() })], { type: 'application/json' })
  const { error } = await store.upload(lockPath(studioId), body, { contentType: 'application/json' })
  if (!error) return true
  const { data } = await store.download(lockPath(studioId))
  const at = data ? (JSON.parse(await data.text()) as { at?: number }).at : undefined
  if (at && Date.now() - at < LOCK_TTL_MS) return false
  await store.remove([lockPath(studioId)])
  return !(await store.upload(lockPath(studioId), body, { contentType: 'application/json' })).error
}

export async function releaseAdAgentLock(admin: SupabaseClient, studioId: string) {
  await admin.storage.from(BUCKET).remove([lockPath(studioId)])
}
