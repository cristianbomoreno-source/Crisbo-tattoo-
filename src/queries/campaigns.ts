import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { err } from '@/lib/errors/types'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'
import { campaignGroup, firstName, type CampaignGroup } from '@/lib/campaigns/audience'
import { BUTTON_NO, BUTTON_YES, CAMPAIGN_KEY, CAMPAIGN_MARKER, REMINDER_MARKER } from '@/lib/campaigns/nuevos-trazos'

export type CampaignRecipient = {
  clientId: string
  name: string
  firstName: string
  phone: string
  /** null = contacto agregado a mano sin visitas registradas. */
  lastVisit: string | null
  group: CampaignGroup
  /** Agregado a mano (no entraba por fecha de última visita). */
  added: boolean
  /** Chat de WhatsApp ya vinculado al cliente, si existe. */
  conversationId: string | null
  /** Estado del mensaje de la campaña (sent/delivered/read/failed); null = no enviado. */
  sentStatus: string | null
  /** Botón que tocó el cliente. */
  reply: 'yes' | 'no' | null
  /** Quitado a mano de la lista: no recibe el envío. */
  excluded: boolean
  /** Pagó el abono: ocupa uno de los cupos. */
  slotTaken: boolean
  /** Escribió algo (botón o texto) después de recibir la campaña. */
  wroteBack: boolean
  /** Ya le llegó el recordatorio del día 5. */
  reminded: boolean
}

export type CampaignData = { recipients: CampaignRecipient[]; slotsTaken: number }

const DAY = 24 * 60 * 60 * 1000
/** Primer envío de la campaña (grupo A, 2026-10-15). */
const CAMPAIGN_START = '2026-10-15T00:00:00Z'

/** Clientes de la campaña "Nuevos Trazos": tienen última visita de hace
 * 3+ meses, teléfono, y NO tienen cita agendada ni se tatuaron en el último
 * mes en la app. Se recalcula en cada visita, así que si alguien agenda sale
 * de la lista solo. */
export async function getCampaignRecipients(): Promise<Result<CampaignRecipient[]>> {
  const data = await getCampaignData()
  return data.success ? ok(data.data.recipients) : data
}

/** Lista + cupos tomados (contados de la tabla, aunque el cliente ya no
 * aparezca en la lista). */
export async function getCampaignData(): Promise<Result<CampaignData>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  return loadCampaignData(await createClient(), {
    studioId: studio.id,
    artistId: studio.role === 'owner' ? null : studio.artistId,
  })
}

/** Núcleo de la lista. Recibe el cliente de Supabase para poder correr
 * también desde el cron (cliente admin, sin sesión): por eso filtra por
 * estudio explícitamente en vez de confiar solo en RLS. */
export async function loadCampaignData(
  supabase: SupabaseClient,
  scope: { studioId: string; artistId: string | null }
): Promise<Result<CampaignData>> {
  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 91 * DAY).toISOString().slice(0, 10)
  const monthAgo = new Date(now.getTime() - 30 * DAY).toISOString()

  // Paginado: Supabase devuelve máximo 1.000 filas por consulta.
  type Row = { id: string; name: string; phone: string | null; last_session_date: string | null }
  const clients: Row[] = []
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from('clients')
      .select('id, name, phone, last_session_date')
      .eq('studio_id', scope.studioId)
      .not('last_session_date', 'is', null)
      .lte('last_session_date', threeMonthsAgo)
      .not('phone', 'is', null)
      .order('last_session_date', { ascending: false })
      .order('id')
      .range(from, from + 999)
    if (scope.artistId) query = query.eq('artist_id', scope.artistId)
    const { data, error } = await query
    if (error) return dbError(error)
    clients.push(...(data as Row[]))
    if (data.length < 1000) break
  }

  // Citas del último mes o futuras (no canceladas): esos clientes salen.
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('projects(client_id)')
    .eq('studio_id', scope.studioId)
    .gte('scheduled_at', monthAgo)
    .neq('status', 'cancelled')
  if (sessionsError) return dbError(sessionsError)
  const busy = new Set<string>()
  // En la DB real `sessions` no tiene client_id: el cliente sale del proyecto.
  for (const s of sessions as unknown as { projects: { client_id: string | null } | null }[]) {
    if (s.projects?.client_id) busy.add(s.projects.client_id)
  }

  // Quitados a mano y cupos tomados.
  const [{ data: exclusions }, { data: slots }, { data: extras }] = await Promise.all([
    supabase.from('campaign_exclusions').select('client_id').eq('studio_id', scope.studioId).eq('campaign', CAMPAIGN_KEY),
    supabase.from('campaign_slots').select('client_id').eq('studio_id', scope.studioId).eq('campaign', CAMPAIGN_KEY),
    supabase.from('campaign_extra_recipients').select('client_id').eq('studio_id', scope.studioId).eq('campaign', CAMPAIGN_KEY),
  ])
  // Contactos agregados a mano: entran aunque no cumplan la regla de fechas.
  const added = new Set(((extras ?? []) as { client_id: string }[]).map((e) => e.client_id))
  const inList = new Set(clients.map((c) => c.id))
  const missing = [...added].filter((id) => !inList.has(id))
  for (let i = 0; i < missing.length; i += 200) {
    let q = supabase
      .from('clients')
      .select('id, name, phone, last_session_date')
      .eq('studio_id', scope.studioId)
      .in('id', missing.slice(i, i + 200))
      .not('phone', 'is', null)
    if (scope.artistId) q = q.eq('artist_id', scope.artistId)
    const { data } = await q
    clients.push(...((data ?? []) as Row[]))
  }
  const excluded = new Set(((exclusions ?? []) as { client_id: string }[]).map((e) => e.client_id))
  const slotTaken = new Set(((slots ?? []) as { client_id: string }[]).map((e) => e.client_id))

  const withPhone = clients.filter((c) => c.phone?.trim())

  // Chats ya vinculados, para abrirlos directo desde la lista.
  const chats = new Map<string, string>()
  const ids = withPhone.map((c) => c.id)
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase
      .from('wa_conversations')
      .select('id, client_id')
      .eq('studio_id', scope.studioId)
      .in('client_id', ids.slice(i, i + 200))
      .order('last_message_at', { ascending: false })
    for (const c of (data ?? []) as { id: string; client_id: string }[]) {
      if (!chats.has(c.client_id)) chats.set(c.client_id, c.id)
    }
  }

  // Mensaje de la campaña y respuesta con los botones, por chat.
  const sentStatus = new Map<string, string>()
  const sentAt = new Map<string, string>()
  const reminded = new Set<string>()
  const wroteBack = new Set<string>()
  const replies = new Map<string, 'yes' | 'no'>()
  const convIds = [...chats.values()]
  for (let i = 0; i < convIds.length; i += 200) {
    const slice = convIds.slice(i, i + 200)
    const [{ data: outs }, { data: ins }] = await Promise.all([
      supabase
        .from('wa_messages')
        .select('conversation_id, status, body, created_at')
        .in('conversation_id', slice)
        .eq('direction', 'out')
        .like('body', `${CAMPAIGN_MARKER}%`)
        // El más reciente gana (p. ej. un reenvío tras un envío fallido).
        .order('created_at', { ascending: true }),
      // Todo lo entrante desde que arrancó la campaña: botones y texto libre.
      supabase
        .from('wa_messages')
        .select('conversation_id, body, created_at')
        .in('conversation_id', slice)
        .eq('direction', 'in')
        .gte('created_at', CAMPAIGN_START)
        .order('created_at', { ascending: true }),
    ])
    for (const m of (outs ?? []) as { conversation_id: string; status: string; body: string; created_at: string }[]) {
      // El recordatorio también empieza con el marcador: no pisa el estado del primer envío.
      if (m.body.startsWith(REMINDER_MARKER)) {
        reminded.add(m.conversation_id)
        continue
      }
      sentStatus.set(m.conversation_id, m.status)
      sentAt.set(m.conversation_id, m.created_at)
    }
    for (const m of (ins ?? []) as { conversation_id: string; body: string | null; created_at: string }[]) {
      const at = sentAt.get(m.conversation_id)
      if (at && new Date(m.created_at) > new Date(at)) wroteBack.add(m.conversation_id)
      if (m.body === BUTTON_YES || m.body === BUTTON_NO) replies.set(m.conversation_id, m.body === BUTTON_YES ? 'yes' : 'no')
    }
  }

  const recipients: CampaignRecipient[] = []
  for (const c of withPhone) {
    const isAdded = added.has(c.id)
    // Los agregados a mano reciben el texto del grupo A si no tienen grupo.
    const group = (c.last_session_date ? campaignGroup(c.last_session_date, now) : null) ?? (isAdded ? 'A' : null)
    if (!group) continue
    const conv = chats.get(c.id) ?? ''
    // Con cita agendada sale de la lista — salvo si ya recibió la campaña,
    // tomó cupo (agendar es justo el objetivo) o lo agregaron a mano.
    if (busy.has(c.id) && !sentStatus.has(conv) && !slotTaken.has(c.id) && !isAdded) continue
    recipients.push({
      clientId: c.id,
      name: c.name,
      firstName: firstName(c.name),
      phone: c.phone!.trim(),
      lastVisit: c.last_session_date,
      group,
      added: isAdded,
      conversationId: chats.get(c.id) ?? null,
      sentStatus: sentStatus.get(conv) ?? null,
      reply: replies.get(conv) ?? null,
      excluded: excluded.has(c.id),
      slotTaken: slotTaken.has(c.id),
      wroteBack: wroteBack.has(conv),
      reminded: reminded.has(conv),
    })
  }
  return ok({ recipients, slotsTaken: slotTaken.size })
}

export type CampaignChatInfo = { clientId: string; slotTaken: boolean; slotsTaken: number }

/** Para la barra de cupos del chat: solo si al chat le llegó la campaña y
 * está vinculado a un cliente. */
export async function getCampaignChatInfo(conversationId: string, clientId: string | null): Promise<CampaignChatInfo | null> {
  if (!clientId) return null
  const supabase = await createClient()
  const { count: sent } = await supabase
    .from('wa_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('direction', 'out')
    .like('body', `${CAMPAIGN_MARKER}%`)
  if (!sent) return null
  const { data: slots } = await supabase.from('campaign_slots').select('client_id').eq('campaign', CAMPAIGN_KEY)
  const ids = ((slots ?? []) as { client_id: string }[]).map((s) => s.client_id)
  return { clientId, slotTaken: ids.includes(clientId), slotsTaken: ids.length }
}
