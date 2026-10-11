import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'

/** Estado de la conexión del estudio — SIN el token (ese nunca sale del
 * servidor). `whatsapp_accounts` no tiene políticas RLS, por eso se lee con
 * el cliente admin después de resolver el estudio del usuario. */
export type WhatsAppAccountStatus = {
  phoneNumberId: string
  wabaId: string
  displayPhone: string | null
  verifiedName: string | null
}

export async function getWhatsAppAccountStatus(): Promise<WhatsAppAccountStatus | null> {
  const studio = await getCurrentStudio()
  if (!studio) return null
  const { data } = await createAdminClient()
    .from('whatsapp_accounts')
    .select('phone_number_id, waba_id, display_phone, verified_name')
    .eq('studio_id', studio.id)
    .maybeSingle()
  if (!data) return null
  return {
    phoneNumberId: data.phone_number_id,
    wabaId: data.waba_id,
    displayPhone: data.display_phone,
    verifiedName: data.verified_name,
  }
}

export type WaConversation = {
  id: string
  studio_id: string
  wa_id: string
  contact_name: string | null
  client_id: string | null
  last_message_at: string
  last_message_preview: string | null
  last_message_direction: 'in' | 'out' | null
  last_inbound_at: string | null
  unread_count: number
  archived: boolean
  created_at: string
  client: { id: string; name: string } | null
}

export type WaMessage = {
  id: string
  conversation_id: string
  studio_id: string
  wa_message_id: string | null
  direction: 'in' | 'out'
  type: string
  body: string | null
  media_id: string | null
  media_mime: string | null
  media_filename: string | null
  status: 'received' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  error: string | null
  sent_by: string | null
  created_at: string
}

const CONVERSATION_SELECT = '*, client:clients(id, name)'

/** RLS (`studio_id = get_studio_id()`) limita a las del estudio activo. */
export async function getConversations(): Promise<Result<WaConversation[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wa_conversations')
    .select(CONVERSATION_SELECT)
    .order('last_message_at', { ascending: false })
    .limit(300)
  if (error) return dbError(error)
  return ok(data as WaConversation[])
}

export async function getConversation(id: string): Promise<Result<WaConversation>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wa_conversations')
    .select(CONVERSATION_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) return dbError(error)
  if (!data) return err('NOT_FOUND', 'Conversación no encontrada')
  return ok(data as WaConversation)
}

/** Últimos 200 mensajes, en orden cronológico. */
export async function getMessages(conversationId: string): Promise<Result<WaMessage[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wa_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return dbError(error)
  return ok((data as WaMessage[]).reverse())
}

/** Conversación vinculada a un cliente (para el botón "Chat" de su ficha). */
export async function getConversationIdForClient(clientId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('wa_conversations')
    .select('id')
    .eq('client_id', clientId)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}
