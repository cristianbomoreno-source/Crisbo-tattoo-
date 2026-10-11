'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'
import { getCurrentPermissions } from '@/queries/permissions'
import {
  fetchPhoneNumberInfo,
  markMessageRead,
  sendTextMessage,
  setPhoneWebhookOverride,
  subscribeAppToWaba,
} from '@/lib/whatsapp-cloud/api'
import { isServiceWindowOpen, messagePreview } from '@/lib/whatsapp-cloud/parse'
import type { WaMessage } from '@/queries/whatsapp'

/* ─────────────── Conexión del número (Ajustes → WhatsApp) ─────────────── */

const accountSchema = z.object({
  phone_number_id: z.string().trim().regex(/^\d{5,30}$/, 'El Phone Number ID son solo números'),
  waba_id: z.string().trim().regex(/^\d{5,30}$/, 'El WABA ID son solo números'),
  // Vacío al editar = conservar el token guardado.
  access_token: z.string().trim().max(1000).optional(),
})

export async function saveWhatsAppAccount(
  input: unknown
): Promise<Result<{ displayPhone: string | null; verifiedName: string | null; webhookWarning: string | null }>> {
  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede conectar WhatsApp')

  const admin = createAdminClient()
  const { data: current } = await admin
    .from('whatsapp_accounts')
    .select('access_token')
    .eq('studio_id', studio.id)
    .maybeSingle()

  const token = parsed.data.access_token || (current?.access_token as string | undefined)
  if (!token) return err('VALIDATION_ERROR', 'Pega el token de acceso de Meta')

  // Antes de guardar: comprobar que Meta acepta el token con ese número.
  let info: Awaited<ReturnType<typeof fetchPhoneNumberInfo>>
  try {
    info = await fetchPhoneNumberInfo(parsed.data.phone_number_id, token)
  } catch (e) {
    return err('VALIDATION_ERROR', `Meta rechazó la conexión: ${(e as Error).message}`)
  }

  const { error } = await admin.from('whatsapp_accounts').upsert(
    {
      studio_id: studio.id,
      phone_number_id: parsed.data.phone_number_id,
      waba_id: parsed.data.waba_id,
      access_token: token,
      display_phone: info.display_phone_number ?? null,
      verified_name: info.verified_name ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'studio_id' }
  )
  if (error) {
    if (error.code === '23505') return err('VALIDATION_ERROR', 'Ese número ya está conectado a otro estudio')
    return dbError(error)
  }

  revalidatePath('/dashboard/settings/whatsapp')
  revalidatePath('/dashboard/inbox')
  const webhookWarning = await routeWebhooksToCrisbo(
    { phone_number_id: parsed.data.phone_number_id, access_token: token },
    parsed.data.waba_id
  )

  return ok({
    displayPhone: info.display_phone_number ?? null,
    verifiedName: info.verified_name ?? null,
    webhookWarning,
  })
}

/** URL pública del webhook: WHATSAPP_WEBHOOK_URL si está, si no el dominio
 * desde el que se está usando la app. `null` en local (Meta no llega a localhost). */
async function webhookCallbackUrl() {
  if (process.env.WHATSAPP_WEBHOOK_URL) return process.env.WHATSAPP_WEBHOOK_URL
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!host || /^(localhost|127\.0\.0\.1)(:|$)/.test(host)) return null
  return `https://${host}/api/whatsapp/webhook`
}

/** Suscribe la app a la WABA y fija el callback propio del número (ver
 * `setPhoneWebhookOverride`: la app de Meta es compartida con otros
 * proyectos). Devuelve un aviso legible si algo falla, sin tumbar el guardado. */
async function routeWebhooksToCrisbo(
  account: { phone_number_id: string; access_token: string },
  wabaId: string
): Promise<string | null> {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  if (!verifyToken) return 'Falta WHATSAPP_VERIFY_TOKEN en Vercel: los mensajes entrantes no llegarán todavía.'
  const callbackUrl = await webhookCallbackUrl()
  if (!callbackUrl) return 'Estás en local: el webhook solo se puede configurar desde el dominio publicado.'
  try {
    await subscribeAppToWaba(wabaId, account.access_token)
    await setPhoneWebhookOverride(account, callbackUrl, verifyToken)
    return null
  } catch (e) {
    return `Número guardado, pero Meta no aceptó el webhook: ${(e as Error).message}`
  }
}

export async function disconnectWhatsAppAccount(): Promise<Result<null>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede desconectar WhatsApp')

  const { error } = await createAdminClient().from('whatsapp_accounts').delete().eq('studio_id', studio.id)
  if (error) return dbError(error)
  revalidatePath('/dashboard/settings/whatsapp')
  revalidatePath('/dashboard/inbox')
  return ok(null)
}

/* ─────────────────────────────── Bandeja ─────────────────────────────── */

async function loadAccount(studioId: string) {
  const { data } = await createAdminClient()
    .from('whatsapp_accounts')
    .select('phone_number_id, access_token')
    .eq('studio_id', studioId)
    .maybeSingle()
  return data as { phone_number_id: string; access_token: string } | null
}

const sendSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, 'Escribe un mensaje').max(4096, 'Máximo 4096 caracteres'),
})

export async function sendWhatsAppMessage(input: unknown): Promise<Result<WaMessage>> {
  const parsed = sendSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  // Cliente de usuario: RLS confirma que el chat es del estudio activo.
  const supabase = await createClient()
  const { data: conv } = await supabase
    .from('wa_conversations')
    .select('id, studio_id, wa_id, last_inbound_at')
    .eq('id', parsed.data.conversationId)
    .maybeSingle()
  if (!conv) return err('NOT_FOUND', 'Conversación no encontrada')

  if (!isServiceWindowOpen(conv.last_inbound_at)) {
    return err(
      'VALIDATION_ERROR',
      'Pasaron más de 24 h desde el último mensaje del cliente. WhatsApp solo permite escribirle con una plantilla aprobada.'
    )
  }

  const account = await loadAccount(conv.studio_id)
  if (!account) return err('VALIDATION_ERROR', 'Conecta tu número en Ajustes → WhatsApp')

  let waMessageId: string
  try {
    waMessageId = await sendTextMessage(account, conv.wa_id, parsed.data.body)
  } catch (e) {
    return err('UNKNOWN_ERROR', `WhatsApp no envió el mensaje: ${(e as Error).message}`)
  }

  const now = new Date().toISOString()
  const admin = createAdminClient()
  const { data: message, error } = await admin
    .from('wa_messages')
    .insert({
      conversation_id: conv.id,
      studio_id: conv.studio_id,
      wa_message_id: waMessageId,
      direction: 'out',
      type: 'text',
      body: parsed.data.body,
      status: 'sent',
      sent_by: studio.artistId,
      created_at: now,
    })
    .select()
    .single()
  if (error) return dbError(error)

  await admin
    .from('wa_conversations')
    .update({
      last_message_at: now,
      last_message_preview: messagePreview('text', parsed.data.body),
      last_message_direction: 'out',
      unread_count: 0,
    })
    .eq('id', conv.id)

  return ok(message as WaMessage)
}

/** Al abrir un chat: contador a 0 y doble check azul para el cliente. */
export async function markConversationRead(conversationId: string): Promise<Result<null>> {
  const supabase = await createClient()
  const { data: conv } = await supabase
    .from('wa_conversations')
    .select('id, studio_id, unread_count')
    .eq('id', conversationId)
    .maybeSingle()
  if (!conv) return err('NOT_FOUND', 'Conversación no encontrada')
  if (conv.unread_count === 0) return ok(null)

  const { error } = await supabase.from('wa_conversations').update({ unread_count: 0 }).eq('id', conversationId)
  if (error) return dbError(error)

  // Best effort: Meta marca como leídos todos los anteriores al último.
  const { data: last } = await supabase
    .from('wa_messages')
    .select('wa_message_id')
    .eq('conversation_id', conversationId)
    .eq('direction', 'in')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const account = await loadAccount(conv.studio_id)
  if (account && last?.wa_message_id) {
    await markMessageRead(account, last.wa_message_id).catch(() => {})
  }
  return ok(null)
}

export async function setConversationArchived(conversationId: string, archived: boolean): Promise<Result<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from('wa_conversations').update({ archived }).eq('id', conversationId)
  if (error) return dbError(error)
  revalidatePath('/dashboard/inbox')
  return ok(null)
}

/** Vincula (o desvincula con `null`) el chat a un cliente existente. */
export async function linkConversationClient(conversationId: string, clientId: string | null): Promise<Result<null>> {
  const supabase = await createClient()
  if (clientId) {
    // RLS de `clients`: solo deja vincular clientes que el usuario puede ver.
    const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).maybeSingle()
    if (!client) return err('NOT_FOUND', 'Cliente no encontrado')
  }
  const { error } = await supabase
    .from('wa_conversations')
    .update({ client_id: clientId })
    .eq('id', conversationId)
  if (error) return dbError(error)
  revalidatePath(`/dashboard/inbox/${conversationId}`)
  return ok(null)
}

/** Crea el cliente con el nombre de perfil y el número del chat, y lo vincula. */
export async function createClientFromConversation(
  conversationId: string,
  name: string
): Promise<Result<{ clientId: string }>> {
  const trimmed = name.trim()
  if (!trimmed) return err('VALIDATION_ERROR', 'El nombre es requerido')

  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_create_clients)
    return err('FORBIDDEN', 'No tienes permiso para crear clientes')

  const supabase = await createClient()
  const { data: conv } = await supabase
    .from('wa_conversations')
    .select('id, wa_id')
    .eq('id', conversationId)
    .maybeSingle()
  if (!conv) return err('NOT_FOUND', 'Conversación no encontrada')

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      name: trimmed.slice(0, 150),
      phone: `+${conv.wa_id}`,
      studio_id: studio.id,
      artist_id: studio.role === 'owner' ? null : studio.artistId,
    })
    .select('id')
    .single()
  if (error) return dbError(error)

  const { error: linkError } = await supabase
    .from('wa_conversations')
    .update({ client_id: client.id })
    .eq('id', conversationId)
  if (linkError) return dbError(linkError)

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/inbox/${conversationId}`)
  return ok({ clientId: client.id as string })
}
