import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { err, ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'
import { customMarker, type AudienceFilter, type AudienceRow } from '@/lib/campaigns/custom'
import type { CampaignRow } from '@/lib/campaigns/custom-send'

const DAY = 86_400_000
/** Encabezados de los mensajes de campaña guardados en el chat. */
const CAMPAIGN_PREFIXES = ['📣', '🖼️ Nuevos Trazos', '🎁']

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Clientes con teléfono que cumplen el filtro de "A quién". */
export async function loadAudience(supabase: SupabaseClient, studioId: string, f: AudienceFilter): Promise<AudienceRow[]> {
  type Row = { id: string; name: string; phone: string | null; last_session_date: string | null }
  const clients: Row[] = []
  // Un solo filtro según el segmento (encadenar condicionales rompe los tipos).
  const before = new Date(Date.now() - Math.max(f.months ?? 3, 1) * 30.4 * DAY).toISOString().slice(0, 10)
  const [col, op, val] =
    f.segment === 'tatuados'
      ? ['last_session_date', 'not.is', 'null']
      : f.segment === 'sin_visitas'
        ? ['last_session_date', 'is', 'null']
        : f.segment === 'inactivos'
          ? ['last_session_date', 'lte', before]
          : ['id', 'not.is', 'null']
  for (let from = 0; ; from += 1000) {
    const q = supabase
      .from('clients')
      .select('id, name, phone, last_session_date')
      .eq('studio_id', studioId)
      .not('phone', 'is', null)
      .filter(col, op, val)
      .order('name')
      .range(from, from + 999)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    clients.push(...((data ?? []) as Row[]))
    if (!data || data.length < 1000) break
  }
  let list = clients.filter((c) => c.phone?.trim())

  // Chats (etapa y para saber quién recibió campañas hace poco).
  const convByClient = new Map<string, { id: string; lead_stage: string | null }>()
  await Promise.all(
    chunk(list.map((c) => c.id), 200).map(async (ids) => {
      const { data } = await supabase
        .from('wa_conversations')
        .select('id, client_id, lead_stage')
        .eq('studio_id', studioId)
        .in('client_id', ids)
      for (const c of (data ?? []) as { id: string; client_id: string; lead_stage: string | null }[]) {
        if (!convByClient.has(c.client_id)) convByClient.set(c.client_id, c)
      }
    })
  )

  if (f.segment === 'etapa' && f.stage) {
    list = list.filter((c) => (convByClient.get(c.id)?.lead_stage ?? 'nuevo') === f.stage)
  }

  if (f.excludeBooked) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('projects(client_id)')
      .eq('studio_id', studioId)
      .gte('scheduled_at', new Date(Date.now() - 30 * DAY).toISOString())
      .neq('status', 'cancelled')
    const busy = new Set(
      ((sessions ?? []) as unknown as { projects: { client_id: string | null } | null }[])
        .map((s) => s.projects?.client_id)
        .filter(Boolean)
    )
    list = list.filter((c) => !busy.has(c.id))
  }

  if (f.excludeRecent) {
    const { data: recent } = await supabase
      .from('wa_messages')
      .select('conversation_id, body')
      .eq('studio_id', studioId)
      .eq('direction', 'out')
      .eq('type', 'template')
      .neq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 7 * DAY).toISOString())
      .limit(5000)
    const recentConvs = new Set(
      ((recent ?? []) as { conversation_id: string; body: string | null }[])
        .filter((m) => CAMPAIGN_PREFIXES.some((p) => m.body?.startsWith(p)))
        .map((m) => m.conversation_id)
    )
    list = list.filter((c) => !recentConvs.has(convByClient.get(c.id)?.id ?? ''))
  }

  return list.map((c) => ({
    clientId: c.id,
    name: c.name,
    phone: c.phone!,
    lastVisit: c.last_session_date,
    stage: convByClient.get(c.id)?.lead_stage ?? null,
  }))
}

async function ownerStudio() {
  const studio = await getCurrentStudio()
  if (!studio) return { error: err('AUTH_ERROR', 'No autenticado') } as const
  if (studio.role !== 'owner') return { error: err('FORBIDDEN', 'Solo el dueño del estudio puede ver las campañas') } as const
  return { studio } as const
}

export async function getCustomCampaigns(): Promise<Result<CampaignRow[]>> {
  const o = await ownerStudio()
  if ('error' in o) return o.error!
  const { data, error } = await (await createClient())
    .from('campaigns')
    .select('*')
    .eq('studio_id', o.studio.id)
    .order('created_at', { ascending: false })
  if (error) return dbError(error)
  return ok((data ?? []) as CampaignRow[])
}

export async function getCustomCampaign(id: string): Promise<Result<CampaignRow>> {
  const o = await ownerStudio()
  if ('error' in o) return o.error!
  const { data, error } = await (await createClient()).from('campaigns').select('*').eq('id', id).maybeSingle()
  if (error) return dbError(error)
  if (!data) return err('NOT_FOUND', 'Campaña no encontrada')
  return ok(data as CampaignRow)
}

export type CustomRecipient = {
  clientId: string
  name: string
  phone: string | null
  conversationId: string | null
  /** null = todavía no se envía. */
  status: string | null
  error: string | null
  replied: boolean
}

/** Lista de clientes de una campaña creada desde la app, con su estado. */
export async function getCustomCampaignRecipients(id: string): Promise<Result<{ campaign: CampaignRow; recipients: CustomRecipient[] }>> {
  const res = await getCustomCampaign(id)
  if (!res.success) return res
  const c = res.data
  const supabase = await createClient()
  const clients: { id: string; name: string; phone: string | null }[] = []
  const convs: { id: string; client_id: string }[] = []
  await Promise.all(
    chunk(c.client_ids, 200).map(async (ids) => {
      const [{ data: cl }, { data: cv }] = await Promise.all([
        supabase.from('clients').select('id, name, phone').in('id', ids),
        supabase.from('wa_conversations').select('id, client_id').eq('studio_id', c.studio_id).in('client_id', ids),
      ])
      clients.push(...((cl ?? []) as typeof clients))
      convs.push(...((cv ?? []) as typeof convs))
    })
  )
  const convOf = new Map(convs.map((x) => [x.client_id, x.id]))
  const sent = new Map<string, { status: string; error: string | null; at: string }>()
  const replied = new Set<string>()
  const convIds = [...new Set(convs.map((x) => x.id))]
  await Promise.all(
    chunk(convIds, 150).map(async (ids) => {
      const { data: outs } = await supabase
        .from('wa_messages')
        .select('conversation_id, status, error, created_at')
        .in('conversation_id', ids)
        .eq('direction', 'out')
        .like('body', `${customMarker(c.name)}%`)
      const rows = (outs ?? []) as { conversation_id: string; status: string; error: string | null; created_at: string }[]
      for (const m of rows) sent.set(m.conversation_id, { status: m.status, error: m.error, at: m.created_at })
      const first = rows.map((m) => m.created_at).sort()[0]
      if (!first) return
      const { data: ins } = await supabase
        .from('wa_messages')
        .select('conversation_id, type, created_at')
        .in('conversation_id', ids)
        .eq('direction', 'in')
        .neq('type', 'reaction')
        .gte('created_at', first)
      for (const m of (ins ?? []) as { conversation_id: string; created_at: string }[]) {
        const s = sent.get(m.conversation_id)
        if (s && m.created_at > s.at) replied.add(m.conversation_id)
      }
    })
  )
  const byId = new Map(clients.map((x) => [x.id, x]))
  const recipients = c.client_ids
    .map((cid) => byId.get(cid))
    .filter((x): x is { id: string; name: string; phone: string | null } => !!x)
    .map((x) => {
      const conv = convOf.get(x.id) ?? null
      const s = conv ? sent.get(conv) : undefined
      return {
        clientId: x.id,
        name: x.name,
        phone: x.phone,
        conversationId: conv,
        status: s?.status ?? null,
        error: s?.error ?? null,
        replied: conv ? replied.has(conv) : false,
      }
    })
  return ok({ campaign: c, recipients })
}
