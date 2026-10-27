import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Chats "Personal" de Mensajes: gente que escribe al WhatsApp/Instagram del
 * estudio pero no es cliente (familia, amigos, contador…). Se guardan como
 * JSON en el bucket privado `studio-private` (igual que lib/social/store.ts),
 * `{ [conversationId]: grupo }`, para no tocar el esquema. Estos chats salen
 * de la bandeja de clientes, del embudo y de las cifras de leads.
 */

export const CONTACT_GROUPS = ['Familia', 'Amigos', 'Contador', 'Proveedor', 'Trabajo', 'Otro'] as const
export type ContactGroup = (typeof CONTACT_GROUPS)[number]

export function isContactGroup(v: unknown): v is ContactGroup {
  return typeof v === 'string' && (CONTACT_GROUPS as readonly string[]).includes(v)
}

const BUCKET = 'studio-private'
const path = (studioId: string) => `${studioId}/contact-groups.json`

export async function loadContactGroups(admin: SupabaseClient, studioId: string): Promise<Record<string, ContactGroup>> {
  const { data, error } = await admin.storage.from(BUCKET).download(path(studioId))
  if (error || !data) return {}
  try {
    const raw = JSON.parse(await data.text()) as Record<string, unknown>
    return Object.fromEntries(Object.entries(raw).filter(([, g]) => isContactGroup(g))) as Record<string, ContactGroup>
  } catch {
    return {}
  }
}

export async function saveContactGroup(admin: SupabaseClient, studioId: string, conversationId: string, group: ContactGroup | null) {
  const current = await loadContactGroups(admin, studioId)
  if (group) current[conversationId] = group
  else delete current[conversationId]
  const body = new Blob([JSON.stringify(current)], { type: 'application/json' })
  let { error } = await admin.storage.from(BUCKET).upload(path(studioId), body, { upsert: true, contentType: 'application/json' })
  if (error && /not found/i.test(error.message)) {
    await admin.storage.createBucket(BUCKET, { public: false })
    ;({ error } = await admin.storage.from(BUCKET).upload(path(studioId), body, { upsert: true, contentType: 'application/json' }))
  }
  if (error) throw new Error(error.message)
}

/** Quita de los avisos push los chats marcados como Personal: siguen
 * llegando a la bandeja, pero sin notificación. */
export async function withoutPersonalChats<T extends { studioId: string }>(admin: SupabaseClient, notify: Map<string, T>) {
  const studios = [...new Set([...notify.values()].map((n) => n.studioId))]
  const groups = await Promise.all(studios.map((id) => loadContactGroups(admin, id).catch(() => ({}) as Record<string, ContactGroup>)))
  const personal = new Set(groups.flatMap((g) => Object.keys(g)))
  return [...notify.entries()].filter(([convId]) => !personal.has(convId)).map(([, n]) => n)
}
