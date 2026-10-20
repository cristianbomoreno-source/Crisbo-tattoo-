import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { err, ok, type Result } from '@/lib/errors/types'
import { getCurrentStudio } from '@/queries/studio'
import { BUTTON_NO, BUTTON_YES, CAMPAIGN_MARKER, CAMPAIGN_NAME, CAMPAIGN_SLOTS, CAMPAIGN_KEY, REMINDER_MARKER } from '@/lib/campaigns/nuevos-trazos'
import { BONO_MARKER, BONO_NAME } from '@/lib/campaigns/bono'
import { customMarker, renderBody } from '@/lib/campaigns/custom'

/** Campañas con estadísticas (una tarjeta y una página cada una). */
export type CampaignSlug = 'nuevos-trazos' | 'bono'

export const CAMPAIGNS: Record<CampaignSlug, { name: string; marker: string; description: string }> = {
  'nuevos-trazos': {
    name: CAMPAIGN_NAME,
    marker: CAMPAIGN_MARKER,
    description: 'Tatuaje hasta 20 cm por $460.000 + minimalista de regalo, para clientes que ya se tatuaron contigo.',
  },
  bono: {
    name: BONO_NAME,
    marker: BONO_MARKER,
    description: 'Bono de $100.000 para el próximo tatuaje (desde 15 cm), hasta el 30 de noviembre.',
  },
}

/** Qué medir: marcador del chat, nombre y botones (si los tiene). */
export type StatsDef = {
  slug: string
  kind: CampaignSlug | 'custom'
  name: string
  marker: string
  description: string
  buttons?: { yes: string; no: string } | null
}

export type CampaignStats = {
  slug: string
  kind: CampaignSlug | 'custom'
  name: string
  description: string
  firstSentAt: string | null
  lastSentAt: string | null
  /** Personas (chats) a las que se intentó enviar. */
  people: number
  /** Estado final por persona (el mejor de sus intentos). */
  status: { read: number; delivered: number; sent: number; failed: number }
  /** Por qué no llegó, en palabras simples. */
  failures: { label: string; hint: string; count: number }[]
  /** Escribieron algo después de recibirla (sin contar reacciones). */
  replied: number
  /** Solo reaccionaron (❤️👍) sin escribir. */
  reactedOnly: number
  buttons: { yes: number; no: number; yesLabel: string; noLabel: string } | null
  /** Etapa actual en Mensajes de quienes la recibieron. */
  stages: { nuevo: number; cotizando: number; abono: number; agendado: number; perdido: number }
  /** Citas creadas después del envío para esos clientes. */
  bookings: number
  /** Pagos registrados después del envío en proyectos de esos clientes. */
  revenue: number
  /** Respuestas por día (fecha de Bogotá → cantidad de personas). */
  repliesByDay: { day: string; count: number }[]
  reminder: { sent: number; replied: number } | null
  slots: { taken: number; total: number } | null
}

const rank: Record<string, number> = { failed: 0, sent: 1, delivered: 2, read: 3 }

function failureOf(error: string | null) {
  const e = error ?? ''
  if (e.startsWith('Message undeliverable'))
    return { label: 'Número sin WhatsApp o mal escrito', hint: 'Esos contactos ya se borraron de tu base.' }
  if (e.includes('healthy ecosystem'))
    return { label: 'Límite de publicidad de WhatsApp', hint: 'WhatsApp frena publicidad a quien ya recibió mucha esa semana. No se cobra.' }
  if (e.includes('experiment'))
    return { label: 'En una prueba de WhatsApp', hint: 'WhatsApp no le muestra publicidad de empresas a ese número por ahora.' }
  if (e.startsWith('Media upload'))
    return { label: 'Falló la imagen', hint: 'Error técnico del envío (ya corregido); se les reenvió con el recordatorio.' }
  return { label: 'Otro motivo', hint: e.slice(0, 80) }
}

const bogotaDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

async function all<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...(data ?? []))
    if (!data || data.length < 1000) return out
  }
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function getCampaignStats(slug: CampaignSlug): Promise<Result<CampaignStats>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede ver las campañas')
  try {
    return ok(await loadCampaignStats(await createClient(), studio.id, slug))
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
}

export async function loadCampaignStats(supabase: SupabaseClient, studioId: string, slug: CampaignSlug): Promise<CampaignStats> {
  return loadStatsFor(supabase, studioId, {
    slug,
    kind: slug,
    ...CAMPAIGNS[slug],
    buttons: slug === 'nuevos-trazos' ? { yes: BUTTON_YES, no: BUTTON_NO } : null,
  })
}

export async function loadStatsFor(supabase: SupabaseClient, studioId: string, def: StatsDef): Promise<CampaignStats> {
  const slug = def.kind
  type Out = { conversation_id: string; status: string; error: string | null; body: string; created_at: string }
  const outs = await all<Out>((a, b) =>
    supabase
      .from('wa_messages')
      .select('conversation_id, status, error, body, created_at')
      .eq('studio_id', studioId)
      .eq('direction', 'out')
      .eq('type', 'template')
      .like('body', `${def.marker}%`)
      .order('created_at')
      .range(a, b)
  )

  // Primer envío vs. recordatorio (solo Nuevos Trazos tiene recordatorio).
  const first = new Map<string, { best: string; at: string; errors: (string | null)[] }>()
  const reminderAt = new Map<string, string>()
  for (const m of outs) {
    if (m.body.startsWith(REMINDER_MARKER)) {
      if (m.status !== 'failed' && !reminderAt.has(m.conversation_id)) reminderAt.set(m.conversation_id, m.created_at)
      continue
    }
    const c = first.get(m.conversation_id) ?? { best: 'failed', at: m.created_at, errors: [] }
    if ((rank[m.status] ?? 0) > (rank[c.best] ?? 0)) c.best = m.status
    c.errors.push(m.error)
    first.set(m.conversation_id, c)
  }

  const status = { read: 0, delivered: 0, sent: 0, failed: 0 }
  const failureCount = new Map<string, { label: string; hint: string; count: number }>()
  for (const c of first.values()) {
    status[c.best as keyof typeof status]++
    if (c.best === 'failed') {
      const f = failureOf(c.errors.find((e) => e) ?? null)
      const cur = failureCount.get(f.label) ?? { ...f, count: 0 }
      cur.count++
      failureCount.set(f.label, cur)
    }
  }
  // Quienes recibieron la oferta: el primer envío llegó, o les llegó el recordatorio.
  const reached = [...first.keys()].filter((id) => first.get(id)!.best !== 'failed' || reminderAt.has(id))
  const firstSentAt = outs[0]?.created_at ?? null
  const lastSentAt = outs.at(-1)?.created_at ?? null

  // Lo que escribieron después.
  type In = { conversation_id: string; type: string; body: string | null; created_at: string }
  const ins: In[] = []
  const convs: { id: string; client_id: string | null; lead_stage: string | null }[] = []
  await Promise.all(
    chunk(reached, 150).map(async (slice) => {
      const [i, c] = await Promise.all([
        all<In>((a, b) =>
          supabase
            .from('wa_messages')
            .select('conversation_id, type, body, created_at')
            .in('conversation_id', slice)
            .eq('direction', 'in')
            .gte('created_at', firstSentAt ?? '2000-01-01')
            .range(a, b)
        ),
        supabase.from('wa_conversations').select('id, client_id, lead_stage').in('id', slice),
      ])
      ins.push(...i)
      convs.push(...((c.data ?? []) as typeof convs))
    })
  )

  const replied = new Set<string>()
  const reacted = new Set<string>()
  const yes = new Set<string>()
  const no = new Set<string>()
  const remindReplied = new Set<string>()
  const firstReplyDay = new Map<string, string>()
  for (const m of ins.sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const sentAt = first.get(m.conversation_id)?.at
    const remAt = reminderAt.get(m.conversation_id)
    const start = sentAt && first.get(m.conversation_id)!.best !== 'failed' ? sentAt : remAt
    if (!start || m.created_at < start) continue
    if (m.type === 'reaction') {
      reacted.add(m.conversation_id)
      continue
    }
    replied.add(m.conversation_id)
    if (!firstReplyDay.has(m.conversation_id)) firstReplyDay.set(m.conversation_id, bogotaDay(m.created_at))
    if (remAt && m.created_at >= remAt) remindReplied.add(m.conversation_id)
    if (def.buttons && m.body === def.buttons.yes) yes.add(m.conversation_id)
    if (def.buttons && m.body === def.buttons.no) no.add(m.conversation_id)
  }

  const stages = { nuevo: 0, cotizando: 0, abono: 0, agendado: 0, perdido: 0 }
  for (const c of convs) {
    const s = (c.lead_stage ?? 'nuevo') as keyof typeof stages
    if (s in stages) stages[s]++
  }

  // Citas y pagos después del envío, en proyectos de esos clientes.
  const clientIds = [...new Set(convs.map((c) => c.client_id).filter((x): x is string => !!x))]
  let bookings = 0
  let revenue = 0
  if (firstSentAt && clientIds.length) {
    const projectIds: string[] = []
    await Promise.all(
      chunk(clientIds, 150).map(async (slice) => {
        const { data } = await supabase.from('projects').select('id').in('client_id', slice)
        projectIds.push(...((data ?? []) as { id: string }[]).map((p) => p.id))
      })
    )
    await Promise.all(
      chunk(projectIds, 150).map(async (slice) => {
        const [{ count }, { data: pays }] = await Promise.all([
          supabase
            .from('sessions')
            .select('id', { count: 'exact', head: true })
            .in('project_id', slice)
            .gte('created_at', firstSentAt)
            .neq('status', 'cancelled'),
          supabase.from('payments').select('amount').in('project_id', slice).gte('created_at', firstSentAt),
        ])
        bookings += count ?? 0
        revenue += ((pays ?? []) as { amount: number | null }[]).reduce((s, p) => s + (p.amount ?? 0), 0)
      })
    )
  }

  const byDay = new Map<string, number>()
  for (const d of firstReplyDay.values()) byDay.set(d, (byDay.get(d) ?? 0) + 1)
  // Días seguidos desde el primer envío hasta hoy (los vacíos en 0), máx. 21.
  const repliesByDay: { day: string; count: number }[] = []
  if (firstSentAt) {
    const start = new Date(`${bogotaDay(firstSentAt)}T12:00:00Z`)
    const today = bogotaDay(new Date().toISOString())
    for (let d = new Date(start); ; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      repliesByDay.push({ day: key, count: byDay.get(key) ?? 0 })
      if (key >= today || repliesByDay.length >= 21) break
    }
  }

  let slots: CampaignStats['slots'] = null
  if (slug === 'nuevos-trazos') {
    const { count } = await supabase
      .from('campaign_slots')
      .select('client_id', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .eq('campaign', CAMPAIGN_KEY)
    slots = { taken: count ?? 0, total: CAMPAIGN_SLOTS }
  }

  return {
    slug: def.slug,
    kind: def.kind,
    name: def.name,
    description: def.description,
    firstSentAt,
    lastSentAt,
    people: first.size,
    status,
    failures: [...failureCount.values()].sort((a, b) => b.count - a.count),
    replied: replied.size,
    reactedOnly: [...reacted].filter((id) => !replied.has(id)).length,
    buttons: def.buttons ? { yes: yes.size, no: no.size, yesLabel: def.buttons.yes, noLabel: def.buttons.no } : null,
    stages,
    bookings,
    revenue,
    repliesByDay,
    reminder: slug === 'nuevos-trazos' ? { sent: reminderAt.size, replied: remindReplied.size } : null,
    slots,
  }
}

/** Estadísticas de una campaña creada desde la app. */
export async function getCustomCampaignStats(c: {
  id: string
  studio_id: string
  name: string
  body_preview: string
  params: string[]
  buttons: string[]
}): Promise<Result<CampaignStats>> {
  try {
    const description = renderBody(c.body_preview, ['{nombre}', ...c.params]).replace(/\s+/g, ' ').slice(0, 160)
    return ok(
      await loadStatsFor(await createClient(), c.studio_id, {
        slug: `c/${c.id}`,
        kind: 'custom',
        name: c.name,
        marker: customMarker(c.name),
        description,
        buttons: c.buttons.length >= 2 ? { yes: c.buttons[0]!, no: c.buttons[1]! } : null,
      })
    )
  } catch (e) {
    return err('DB_ERROR', (e as Error).message)
  }
}
