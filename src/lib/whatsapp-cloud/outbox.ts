import type { SupabaseClient } from '@supabase/supabase-js'

/** Deja en el chat del cliente un mensaje que la app envió sola (lo crea si
 * no existe y actualiza la vista previa de la bandeja). */
export async function saveOutgoing(
  admin: SupabaseClient,
  m: {
    studioId: string
    waId: string
    client: { id: string; name: string } | null
    waMessageId: string
    body: string
    preview: string
    type?: 'text' | 'template'
  }
) {
  await admin
    .from('wa_conversations')
    .upsert(
      { studio_id: m.studioId, wa_id: m.waId, contact_name: m.client?.name ?? null, client_id: m.client?.id ?? null },
      { onConflict: 'studio_id,wa_id', ignoreDuplicates: true }
    )
  const { data: conv } = await admin
    .from('wa_conversations')
    .select('id')
    .eq('studio_id', m.studioId)
    .eq('wa_id', m.waId)
    .single()
  if (!conv) return
  const now = new Date().toISOString()
  await admin.from('wa_messages').insert({
    conversation_id: conv.id,
    studio_id: m.studioId,
    wa_message_id: m.waMessageId,
    direction: 'out',
    type: m.type ?? 'text',
    body: m.body,
    status: 'sent',
    created_at: now,
  })
  await admin
    .from('wa_conversations')
    .update({ last_message_at: now, last_message_preview: m.preview.slice(0, 120), last_message_direction: 'out' })
    .eq('id', conv.id)
}
