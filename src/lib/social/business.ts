import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays, bogotaDay, dayStart, lastMonths, shiftMonthKey } from './dates'

/** Números del negocio que salen de la app (pagos, chats, citas) para cruzarlos
 * con las redes. Solo conteos y sumas filtrados en la base (nunca traer todo:
 * la API corta en 1.000 filas). */

export type BusinessMonth = { month: string; income: number; leadsWhatsapp: number; leadsInstagram: number }

export type BusinessOverview = {
  monthly: BusinessMonth[]
  incomeThisMonth: number
  /** Ticket promedio por proyecto pagado en los últimos 6 meses (null si no hay pagos). */
  avgTicket: number | null
  /** Chats que llegaron en los últimos 30 días, por etapa actual. */
  funnel30: { total: number; cotizando: number; abono: number; agendado: number; perdido: number }
  /** Chats en Cotizando o Esperando abono hoy (sin importar cuándo llegaron). */
  openLeads: number
  sessionsThisMonth: number
}

async function count(q: PromiseLike<{ count: number | null }>) {
  return (await q).count ?? 0
}

export async function loadBusinessOverview(admin: SupabaseClient, studioId: string, months = 6): Promise<BusinessOverview> {
  const today = bogotaDay()
  const thisMonth = today.slice(0, 7)
  const keys = lastMonths(thisMonth, months)
  const from = dayStart(`${keys[0]}-01`).toISOString()
  const since30 = dayStart(addDays(today, -29)).toISOString()

  // Solo chats donde la persona escribió: las campañas crean conversaciones
  // de salida que nadie respondió y no son interesados.
  const conv = () =>
    admin
      .from('wa_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .not('last_inbound_at', 'is', null)

  const [payments, leadCounts, stageCounts, openLeads, sessionsThisMonth] = await Promise.all([
    admin
      .from('payments')
      .select('amount, paid_at, project_id')
      .eq('studio_id', studioId)
      .gte('paid_at', from)
      .order('paid_at')
      .limit(1000),
    Promise.all(
      keys.flatMap((month) => {
        const a = dayStart(`${month}-01`).toISOString()
        const b = dayStart(`${shiftMonthKey(month, 1)}-01`).toISOString()
        return (['whatsapp', 'instagram'] as const).map((channel) =>
          count(conv().eq('channel', channel).gte('created_at', a).lt('created_at', b))
        )
      })
    ),
    Promise.all(
      (['cotizando', 'abono', 'agendado', 'perdido'] as const).map((stage) =>
        count(conv().gte('created_at', since30).eq('lead_stage', stage))
      )
    ).then(async (stages) => [await count(conv().gte('created_at', since30)), ...stages]),
    count(conv().in('lead_stage', ['cotizando', 'abono'])),
    count(
      admin
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('studio_id', studioId)
        .neq('status', 'cancelled')
        .gte('scheduled_at', dayStart(`${thisMonth}-01`).toISOString())
        .lt('scheduled_at', dayStart(`${shiftMonthKey(thisMonth, 1)}-01`).toISOString())
    ),
  ])

  const rows = (payments.data ?? []) as { amount: number; paid_at: string; project_id: string | null }[]
  const incomeBy = new Map<string, number>()
  const byProject = new Map<string, number>()
  for (const p of rows) {
    const m = bogotaDay(new Date(p.paid_at)).slice(0, 7)
    incomeBy.set(m, (incomeBy.get(m) ?? 0) + p.amount)
    const key = p.project_id ?? p.paid_at
    byProject.set(key, (byProject.get(key) ?? 0) + p.amount)
  }
  const projectTotals = [...byProject.values()]

  const [total = 0, cotizando = 0, abono = 0, agendado = 0, perdido = 0] = stageCounts
  return {
    monthly: keys.map((month, i) => ({
      month,
      income: incomeBy.get(month) ?? 0,
      leadsWhatsapp: leadCounts[i * 2] ?? 0,
      leadsInstagram: leadCounts[i * 2 + 1] ?? 0,
    })),
    incomeThisMonth: incomeBy.get(thisMonth) ?? 0,
    avgTicket: projectTotals.length ? Math.round(projectTotals.reduce((s, n) => s + n, 0) / projectTotals.length) : null,
    funnel30: { total, cotizando, abono, agendado, perdido },
    openLeads,
    sessionsThisMonth,
  }
}
