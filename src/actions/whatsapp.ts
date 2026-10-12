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
  createFlowTemplate,
  createPublishedFlow,
  fetchPhoneNumberInfo,
  fetchTemplateStatus,
  markMessageRead,
  sendFlowTemplate,
  sendImageMessage,
  sendLocationMessage,
  sendTextMessage,
  setPhoneWebhookOverride,
  subscribeAppToWaba,
} from '@/lib/whatsapp-cloud/api'
import { isServiceWindowOpen, messagePreview } from '@/lib/whatsapp-cloud/parse'
import {
  FORM_BUTTON_TEXT,
  FORM_TEMPLATE_LANGUAGE,
  formFlowJson,
  formTemplateBody,
} from '@/lib/whatsapp-cloud/data-form'
import type { WaMessage } from '@/queries/whatsapp'
import { buildBookingConfirmation } from '@/actions/sessions'
import { STUDIO_LOCATION, studioLocationText } from '@/lib/whatsapp-cloud/studio-location'
import { findShortcut } from '@/lib/whatsapp-cloud/chat-shortcuts'
import { LEAD_STAGE_KEYS } from '@/lib/whatsapp-cloud/lead'
import { chatChannel, type ChatChannel } from '@/lib/instagram/channel'
import { loadInstagramAccount } from '@/lib/instagram/account'
import { markInstagramSeen, sendInstagramImage, sendInstagramText } from '@/lib/instagram/api'

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

type Chat = { id: string; studio_id: string; wa_id: string; last_inbound_at: string | null; channel: ChatChannel }

/** Chat del estudio activo (RLS) con su canal. `*`: antes de la migración de
 * Instagram la columna `channel` no existe y se asume WhatsApp. */
async function loadChat(conversationId: string): Promise<Chat | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('wa_conversations').select('*').eq('id', conversationId).maybeSingle()
  if (!data) return null
  return { ...(data as Omit<Chat, 'channel'>), channel: chatChannel(data) }
}

const CHANNEL_NAME: Record<ChatChannel, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram' }

function windowClosedError(chat: Chat, what: string) {
  return err(
    'VALIDATION_ERROR',
    chat.channel === 'instagram'
      ? `Pasaron más de 24 h desde el último mensaje del cliente: Instagram no permite ${what} hasta que te vuelva a escribir.`
      : `Pasaron más de 24 h desde el último mensaje del cliente: WhatsApp no permite ${what}.`
  )
}

type Outgoing =
  | { kind: 'text'; body: string }
  | { kind: 'image'; link: string; caption: string }
  | { kind: 'location' }

/** Envía por el canal del chat y devuelve el id del mensaje en Meta. Lanza
 * un Error legible si no hay cuenta conectada o Meta rechaza el envío. */
async function deliver(chat: Chat, out: Outgoing): Promise<string> {
  if (chat.channel === 'instagram') {
    const account = await loadInstagramAccount(createAdminClient(), chat.studio_id)
    if (!account) throw new Error('Conecta tu Instagram en Ajustes → Instagram')
    switch (out.kind) {
      case 'text':
        return sendInstagramText(account, chat.wa_id, out.body)
      case 'image': {
        // Instagram no tiene pie de foto: la imagen y luego el texto.
        const id = await sendInstagramImage(account, chat.wa_id, out.link)
        if (out.caption) await sendInstagramText(account, chat.wa_id, out.caption)
        return id
      }
      case 'location':
        // Sin mensajes de ubicación en Instagram: dirección + enlace a Maps.
        return sendInstagramText(account, chat.wa_id, `📍 ${studioLocationText()}`)
    }
  }

  const account = await loadAccount(chat.studio_id)
  if (!account) throw new Error('Conecta tu número en Ajustes → WhatsApp')
  switch (out.kind) {
    case 'text':
      return sendTextMessage(account, chat.wa_id, out.body)
    case 'image':
      return sendImageMessage(account, chat.wa_id, { link: out.link, caption: out.caption })
    case 'location':
      return sendLocationMessage(account, chat.wa_id, STUDIO_LOCATION)
  }
}

/** Guarda el mensaje enviado y actualiza la vista previa del chat. */
async function recordOutgoing(
  chat: Chat,
  waMessageId: string,
  fields: { type: string; body: string | null; media_url?: string },
  sentBy: string | null,
  preview: string
): Promise<Result<WaMessage>> {
  const now = new Date().toISOString()
  const admin = createAdminClient()
  let { data: message, error } = await admin
    .from('wa_messages')
    .insert({
      conversation_id: chat.id,
      studio_id: chat.studio_id,
      wa_message_id: waMessageId,
      direction: 'out',
      ...fields,
      status: 'sent',
      sent_by: sentBy,
      created_at: now,
    })
    .select()
    .single()
  // Instagram avisa por webhook (eco) de lo que mandamos por la API: si el eco
  // llegó antes que esta respuesta, el mensaje ya está guardado.
  if (error?.code === '23505') {
    ;({ data: message, error } = await admin
      .from('wa_messages')
      .update({ sent_by: sentBy, ...fields })
      .eq('wa_message_id', waMessageId)
      .select()
      .single())
  }
  if (error) return dbError(error)

  await admin
    .from('wa_conversations')
    .update({
      last_message_at: now,
      last_message_preview: preview,
      last_message_direction: 'out',
      unread_count: 0,
    })
    .eq('id', chat.id)

  return ok(message as WaMessage)
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

  const chat = await loadChat(parsed.data.conversationId)
  if (!chat) return err('NOT_FOUND', 'Conversación no encontrada')

  if (!isServiceWindowOpen(chat.last_inbound_at)) {
    return chat.channel === 'instagram'
      ? windowClosedError(chat, 'escribirle')
      : err(
          'VALIDATION_ERROR',
          'Pasaron más de 24 h desde el último mensaje del cliente. WhatsApp solo permite escribirle con una plantilla aprobada.'
        )
  }

  let waMessageId: string
  try {
    waMessageId = await deliver(chat, { kind: 'text', body: parsed.data.body })
  } catch (e) {
    return err('UNKNOWN_ERROR', `${CHANNEL_NAME[chat.channel]} no envió el mensaje: ${(e as Error).message}`)
  }

  return recordOutgoing(
    chat,
    waMessageId,
    { type: 'text', body: parsed.data.body },
    studio.artistId,
    messagePreview('text', parsed.data.body)
  )
}

/** Al abrir un chat: contador a 0 y "visto" para el cliente. */
export async function markConversationRead(conversationId: string): Promise<Result<null>> {
  const chat = await loadChat(conversationId)
  if (!chat) return err('NOT_FOUND', 'Conversación no encontrada')
  const supabase = await createClient()
  const { data: conv } = await supabase
    .from('wa_conversations')
    .select('unread_count')
    .eq('id', conversationId)
    .maybeSingle()
  if (!conv || conv.unread_count === 0) return ok(null)

  const { error } = await supabase.from('wa_conversations').update({ unread_count: 0 }).eq('id', conversationId)
  if (error) return dbError(error)

  // Best effort: "visto" en Instagram; en WhatsApp, doble check azul hasta el último.
  if (chat.channel === 'instagram') {
    const account = await loadInstagramAccount(createAdminClient(), chat.studio_id)
    if (account) await markInstagramSeen(account, chat.wa_id).catch(() => {})
    return ok(null)
  }
  const { data: last } = await supabase
    .from('wa_messages')
    .select('wa_message_id')
    .eq('conversation_id', conversationId)
    .eq('direction', 'in')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const account = await loadAccount(chat.studio_id)
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

/** Botones de seguimiento del chat: mueve el lead de etapa en el embudo. */
export async function setLeadStage(conversationId: string, stage: unknown): Promise<Result<null>> {
  const parsed = z.enum(LEAD_STAGE_KEYS).safeParse(stage)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Etapa no válida')
  const supabase = await createClient()
  const { error } = await supabase
    .from('wa_conversations')
    .update({ lead_stage: parsed.data, lead_stage_at: new Date().toISOString() })
    .eq('id', conversationId)
  if (error) return dbError(error)
  revalidatePath('/dashboard/inbox', 'layout')
  return ok(null)
}

/** Recordatorio de seguimiento: fecha ISO o `null` para quitarlo. */
export async function setFollowUp(conversationId: string, at: string | null): Promise<Result<null>> {
  if (at !== null && Number.isNaN(Date.parse(at))) return err('VALIDATION_ERROR', 'Fecha no válida')
  const supabase = await createClient()
  const { error } = await supabase
    .from('wa_conversations')
    .update({ follow_up_at: at })
    .eq('id', conversationId)
  if (error) return dbError(error)
  revalidatePath('/dashboard/inbox', 'layout')
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
  const { data: conv } = await supabase.from('wa_conversations').select('*').eq('id', conversationId).maybeSingle()
  if (!conv) return err('NOT_FOUND', 'Conversación no encontrada')
  // Instagram no da el teléfono: se guarda el @ en la ficha.
  const instagram = chatChannel(conv) === 'instagram'

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      name: trimmed.slice(0, 150),
      ...(instagram
        ? { phone: null, instagram: conv.ig_username ? `@${conv.ig_username}` : null, source: 'Instagram' }
        : { phone: `+${conv.wa_id}` }),
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

/* ───────────── Formulario de datos (WhatsApp Flow + plantilla) ───────────── */

export type DataFormStatus = { status: string; reason: string | null }

/** Crea el Flow (nombre, celular, correo, nacimiento), lo publica y manda a
 * revisión de Meta la plantilla con el botón que lo abre. Cada intento usa
 * nombres nuevos: Meta no deja reutilizar el nombre de una plantilla borrada
 * o rechazada. */
export async function setupDataForm(): Promise<Result<DataFormStatus>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede configurar plantillas')

  const admin = createAdminClient()
  const { data: acc } = await admin
    .from('whatsapp_accounts')
    .select('waba_id, access_token, verified_name')
    .eq('studio_id', studio.id)
    .maybeSingle()
  if (!acc) return err('VALIDATION_ERROR', 'Primero conecta tu número de WhatsApp')

  const suffix = Date.now().toString(36)
  const name = `formulario_datos_${suffix}`
  let flowId: string
  try {
    flowId = await createPublishedFlow(acc.waba_id, acc.access_token, `Formulario de datos ${suffix}`, formFlowJson())
  } catch (e) {
    return err('UNKNOWN_ERROR', `Meta no aceptó el formulario: ${(e as Error).message}`)
  }

  let status = 'PENDING'
  try {
    const t = await createFlowTemplate(acc.waba_id, acc.access_token, {
      name,
      language: FORM_TEMPLATE_LANGUAGE,
      body: formTemplateBody(acc.verified_name || studio.name),
      buttonText: FORM_BUTTON_TEXT,
      flowId,
      firstScreen: 'DATOS',
    })
    status = t.status ?? 'PENDING'
  } catch (e) {
    return err('UNKNOWN_ERROR', `Formulario creado, pero Meta no aceptó la plantilla: ${(e as Error).message}`)
  }

  const { error } = await admin
    .from('whatsapp_accounts')
    .update({ form_flow_id: flowId, form_template_name: name, form_template_status: status, form_template_reason: null })
    .eq('studio_id', studio.id)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings/whatsapp')
  revalidatePath('/dashboard/inbox', 'layout')
  return ok({ status, reason: null })
}

/** Pregunta a Meta cómo va la revisión y guarda el resultado. */
async function syncDataFormStatus(studioId: string) {
  const admin = createAdminClient()
  const { data: acc } = await admin
    .from('whatsapp_accounts')
    .select('waba_id, access_token, form_template_name')
    .eq('studio_id', studioId)
    .maybeSingle()
  if (!acc?.form_template_name) return null
  const t = await fetchTemplateStatus(acc.waba_id, acc.access_token, acc.form_template_name)
  await admin
    .from('whatsapp_accounts')
    .update({ form_template_status: t.status, form_template_reason: t.reason })
    .eq('studio_id', studioId)
  return t
}

export async function refreshDataFormStatus(): Promise<Result<DataFormStatus>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  try {
    const t = await syncDataFormStatus(studio.id)
    if (!t) return err('NOT_FOUND', 'Todavía no has creado el formulario')
    revalidatePath('/dashboard/settings/whatsapp')
    revalidatePath('/dashboard/inbox', 'layout')
    return ok(t)
  } catch (e) {
    return err('UNKNOWN_ERROR', `No se pudo consultar a Meta: ${(e as Error).message}`)
  }
}

/** Envía el formulario de datos al chat. Al ser plantilla aprobada, funciona
 * también fuera de la ventana de 24 h. */
export async function sendDataForm(conversationId: string): Promise<Result<WaMessage>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { data: conv } = await supabase.from('wa_conversations').select('*').eq('id', conversationId).maybeSingle()
  if (!conv) return err('NOT_FOUND', 'Conversación no encontrada')
  if (chatChannel(conv) === 'instagram') {
    return err('VALIDATION_ERROR', 'El formulario de datos solo funciona en chats de WhatsApp.')
  }

  const admin = createAdminClient()
  const { data: acc } = await admin
    .from('whatsapp_accounts')
    .select('phone_number_id, access_token, verified_name, form_template_name, form_template_status')
    .eq('studio_id', conv.studio_id)
    .maybeSingle()
  if (!acc) return err('VALIDATION_ERROR', 'Conecta tu número en Ajustes → WhatsApp')
  if (!acc.form_template_name) {
    return err('VALIDATION_ERROR', 'Crea el formulario en Ajustes → WhatsApp Business → Formulario de datos')
  }

  let status = acc.form_template_status as string | null
  if (status !== 'APPROVED') {
    const t = await syncDataFormStatus(conv.studio_id).catch(() => null)
    status = t?.status ?? status
  }
  if (status !== 'APPROVED') {
    return err('VALIDATION_ERROR', 'Meta todavía no aprueba la plantilla del formulario (suele tardar unos minutos).')
  }

  let waMessageId: string
  try {
    waMessageId = await sendFlowTemplate(acc, conv.wa_id, {
      name: acc.form_template_name,
      language: FORM_TEMPLATE_LANGUAGE,
      flowToken: conv.id,
    })
  } catch (e) {
    return err('UNKNOWN_ERROR', `WhatsApp no envió el formulario: ${(e as Error).message}`)
  }

  const body = `${formTemplateBody(acc.verified_name || studio.name)}\n\n[${FORM_BUTTON_TEXT}]`
  const now = new Date().toISOString()
  const { data: message, error } = await admin
    .from('wa_messages')
    .insert({
      conversation_id: conv.id,
      studio_id: conv.studio_id,
      wa_message_id: waMessageId,
      direction: 'out',
      type: 'template',
      body,
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
      last_message_preview: '📋 Formulario de datos enviado',
      last_message_direction: 'out',
      unread_count: 0,
    })
    .eq('id', conv.id)

  return ok(message as WaMessage)
}

/** Tras agendar desde el chat: manda la confirmación de la cita por la API
 * (texto libre: solo dentro de la ventana de 24 h). */
export async function sendBookingConfirmationToChat(
  conversationId: string,
  sessionId: string
): Promise<Result<WaMessage>> {
  // Si el chat aún no tenía cliente, queda vinculado al de la cita.
  const supabase = await createClient()
  const { data: session } = await supabase
    .from('sessions')
    .select('projects(client_id)')
    .eq('id', sessionId)
    .maybeSingle()
  const clientId = (session as { projects: { client_id: string | null } | null } | null)?.projects?.client_id
  if (clientId) {
    await supabase.from('wa_conversations').update({ client_id: clientId }).eq('id', conversationId).is('client_id', null)
    // Chat de Instagram: el @ queda en la ficha (así los próximos chats se vinculan solos).
    const { data: conv } = await supabase.from('wa_conversations').select('*').eq('id', conversationId).maybeSingle()
    if (conv && chatChannel(conv) === 'instagram' && conv.ig_username) {
      await supabase
        .from('clients')
        .update({ instagram: `@${conv.ig_username}` })
        .eq('id', clientId)
        .is('instagram', null)
    }
  }
  // Cita agendada desde el chat: el lead pasa a "Agendado" y se cierra el seguimiento.
  await supabase
    .from('wa_conversations')
    .update({ lead_stage: 'agendado', lead_stage_at: new Date().toISOString(), follow_up_at: null })
    .eq('id', conversationId)
  revalidatePath('/dashboard/inbox', 'layout')

  const confirmation = await buildBookingConfirmation(sessionId)
  if (!confirmation.success) return confirmation
  return sendWhatsAppMessage({ conversationId, body: confirmation.data.message })
}

/** Botón "Ubicación" del chat: en WhatsApp, mapa con pin del estudio; en
 * Instagram, la dirección con enlace a Maps (gratis, dentro de 24 h). */
export async function sendStudioLocation(conversationId: string): Promise<Result<WaMessage>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')

  const chat = await loadChat(conversationId)
  if (!chat) return err('NOT_FOUND', 'Conversación no encontrada')
  if (!isServiceWindowOpen(chat.last_inbound_at)) return windowClosedError(chat, 'enviar la ubicación')

  let waMessageId: string
  try {
    waMessageId = await deliver(chat, { kind: 'location' })
  } catch (e) {
    return err('UNKNOWN_ERROR', `${CHANNEL_NAME[chat.channel]} no envió la ubicación: ${(e as Error).message}`)
  }

  return recordOutgoing(
    chat,
    waMessageId,
    { type: 'location', body: studioLocationText() },
    studio.artistId,
    messagePreview('location', null)
  )
}

/** Botones de mensajes fijos del chat (`chat-shortcuts.ts`): texto, o imagen
 * con pie de foto (p. ej. la infografía de cuidados). Gratis, dentro de 24 h. */
export async function sendChatShortcut(conversationId: string, key: string): Promise<Result<WaMessage>> {
  const shortcut = findShortcut(key)
  if (!shortcut) return err('NOT_FOUND', 'Mensaje no encontrado')
  if (!shortcut.image) return sendWhatsAppMessage({ conversationId, body: shortcut.text })

  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  const chat = await loadChat(conversationId)
  if (!chat) return err('NOT_FOUND', 'Conversación no encontrada')
  if (!isServiceWindowOpen(chat.last_inbound_at)) return windowClosedError(chat, 'enviar la imagen')

  // Meta descarga la imagen desde nuestro dominio público.
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!host || /^(localhost|127\.0\.0\.1)(:|$)/.test(host)) {
    return err('VALIDATION_ERROR', 'Las imágenes solo se pueden enviar desde crisbotattoo.com (no desde local).')
  }

  let waMessageId: string
  try {
    waMessageId = await deliver(chat, { kind: 'image', link: `https://${host}${shortcut.image}`, caption: shortcut.text })
  } catch (e) {
    return err('UNKNOWN_ERROR', `${CHANNEL_NAME[chat.channel]} no envió la imagen: ${(e as Error).message}`)
  }

  return recordOutgoing(
    chat,
    waMessageId,
    { type: 'image', body: shortcut.text, media_url: shortcut.image },
    studio.artistId,
    messagePreview('image', shortcut.text)
  )
}
