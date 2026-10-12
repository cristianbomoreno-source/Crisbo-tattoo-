/** Cliente mínimo de la API de Instagram (inicio de sesión de Instagram,
 * graph.instagram.com). Solo servidor: el token del estudio vive en
 * `instagram_accounts` y nunca llega al navegador. */

import { splitIgText } from './parse'

const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || 'v23.0'
const GRAPH = `https://graph.instagram.com/${GRAPH_VERSION}`

export type IgAccountCredentials = {
  ig_user_id: string
  access_token: string
}

type GraphError = { error?: { message?: string; code?: number; error_user_msg?: string } }

async function graph<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url.startsWith('http') ? url : `${GRAPH}${url}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as T & GraphError
  if (!res.ok) {
    const e = json.error
    throw new Error(e?.error_user_msg || e?.message || `Instagram respondió ${res.status}`)
  }
  return json
}

/** Datos de la cuenta dueña del token — "Probar conexión" en Ajustes.
 * `user_id` es el id que llega como entry.id en los webhooks. */
export async function fetchInstagramMe(token: string) {
  return graph<{ id: string; user_id?: string; username?: string; name?: string; account_type?: string }>(
    '/me?fields=id,user_id,username,name,account_type',
    token
  )
}

/** Suscribe la cuenta a los webhooks de mensajes (idempotente). */
export async function subscribeInstagramWebhooks(token: string) {
  await graph('/me/subscribed_apps?subscribed_fields=messages', token, { method: 'POST' })
}

/** Nombre y @usuario de quien escribe (best effort: requiere que el cliente
 * haya escrito primero, que es siempre el caso en la bandeja). */
export async function fetchInstagramProfile(igsid: string, token: string) {
  return graph<{ name?: string; username?: string }>(`/${encodeURIComponent(igsid)}?fields=name,username`, token)
}

async function sendMessage(account: IgAccountCredentials, recipientId: string, message: object) {
  const json = await graph<{ message_id?: string }>(
    `/${encodeURIComponent(account.ig_user_id)}/messages`,
    account.access_token,
    { method: 'POST', body: JSON.stringify({ recipient: { id: recipientId }, message }) }
  )
  if (!json.message_id) throw new Error('Instagram no devolvió el id del mensaje')
  return json.message_id
}

/** Texto libre (solo dentro de 24 h desde el último mensaje del cliente).
 * Si pasa de 1000 caracteres se manda en varios mensajes; devuelve el id del primero. */
export async function sendInstagramText(account: IgAccountCredentials, recipientId: string, text: string) {
  const [first, ...rest] = splitIgText(text)
  const id = await sendMessage(account, recipientId, { text: first ?? text })
  for (const chunk of rest) await sendMessage(account, recipientId, { text: chunk })
  return id
}

/** Imagen por URL pública (Instagram la descarga). */
export async function sendInstagramImage(account: IgAccountCredentials, recipientId: string, url: string) {
  return sendMessage(account, recipientId, { attachment: { type: 'image', payload: { url } } })
}

/** "Visto" para el cliente (best effort). */
export async function markInstagramSeen(account: IgAccountCredentials, recipientId: string) {
  await graph(`/${encodeURIComponent(account.ig_user_id)}/messages`, account.access_token, {
    method: 'POST',
    body: JSON.stringify({ recipient: { id: recipientId }, sender_action: 'mark_seen' }),
  })
}

/** Renueva el token de larga duración (dura 60 días; se puede renovar
 * cuando tiene más de 24 h). Devuelve el token nuevo. */
export async function refreshInstagramToken(token: string) {
  const json = await graph<{ access_token?: string; expires_in?: number }>(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
    token
  )
  if (!json.access_token) throw new Error('Instagram no devolvió el token renovado')
  return json.access_token
}
