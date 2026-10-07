import { getStudioSessions, type SessionWithProject } from '@/queries/sessions'
import { getProjects, type ProjectSummary } from '@/queries/projects'
import { getConsents } from '@/queries/consents'
import { getClients } from '@/queries/clients'
import { listTeam, type TeamMember } from '@/actions/team'
import { getUnreadNotificationCount } from '@/queries/notifications'
import { daySummary } from '@/lib/home/day-metrics'
import { calculateBalance } from '@/lib/projects/metrics'
import { todayKey, dayKey, TZ, nowAsWallClock } from '@/lib/calendar/utils'

export type StudioSession = SessionWithProject & { artists: { id: string; name: string } | null }

export type ArtistToday = {
  artistId: string
  name: string
  /** 'working' = tiene sesiones hoy, 'off' = sin sesiones hoy (descanso). */
  presence: 'working' | 'off'
  sessionCount: number
  projectedIncome: number
  sessions: StudioSession[]
  /** Estado puntual ahora mismo, para "Estado de tatuadores". */
  status: 'in_session' | 'available' | 'next_appointment' | 'off'
  /** Rango de jornada de hoy (primera a última cita), si tiene. */
  scheduleLabel: string | null
  /** Hora de la próxima cita (o la que está en curso), si aplica. */
  nextLabel: string | null
}

export type AgendaAlert = {
  id: string
  kind: 'missing_consent' | 'pending_payment' | 'starting_soon'
  artistName: string
  message: string
  detail: string
}

export type RecentActivityItem = {
  id: string
  message: string
  detail: string
  at: string
}

export type StudioHomeData = {
  studioName: string
  todaySessions: StudioSession[]
  team: ArtistToday[]
  daySummaryData: { expected: number; deposits: number; pending: number }
  citasHoy: number
  tatuadoresActivos: number
  pendientes: number
  canceladas: number
  alerts: AgendaAlert[]
  recentActivity: RecentActivityItem[]
  unreadNotifications: number
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function relativeLabel(iso: string, nowMs: number): string {
  const diffMin = Math.round((nowMs - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'Justo ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH} hora${diffH === 1 ? '' : 's'}`
  const diffD = Math.round(diffH / 24)
  return `Hace ${diffD} día${diffD === 1 ? '' : 's'}`
}

function formatCOPShort(amount: number) {
  return `$${Math.round(amount).toLocaleString('es-CO')}`
}

/**
 * Agrega TODO lo que necesita el nuevo Home de cuentas 'estudio' (ver
 * `src/components/home/estudio/*`) en una sola función — pensado para
 * llamarse una vez desde `dashboard/page.tsx` cuando `studio.accountKind
 * === 'estudio' && studio.role === 'owner'`. Reutiliza las queries/actions
 * existentes (getStudioSessions, getProjects, listTeam, getConsents,
 * getClients) en vez de tocar su lógica — nada de esto cambia el
 * comportamiento del Home del tatuador independiente.
 */
export async function getStudioHomeData(studioName: string): Promise<StudioHomeData> {
  const today = todayKey()
  const dayStart = `${today}T00:00:00.000Z`
  const dayEnd = `${today}T23:59:59.999Z`
  const now = new Date()
  const nowMs = now.getTime()
  // Aparte de `nowMs` (instante real, para "hace X min" de la actividad
  // reciente): las comparaciones contra `scheduled_at` necesitan la hora
  // "de pared" de Bogotá (ver nota en `nowAsWallClock`), no el instante
  // real — si no, con Bogotá en UTC-5 una cita que en la vida real todavía
  // no empieza podía verse "en curso"/"ya pasada" 5 horas antes de tiempo.
  const scheduleNowMs = nowAsWallClock().getTime()

  const [sessionsResult, projectsResult, teamResult, consentsResult, clientsResult, unreadNotifications] =
    await Promise.all([
      getStudioSessions(dayStart, dayEnd),
      getProjects(),
      listTeam(),
      getConsents(),
      getClients(),
      getUnreadNotificationCount(),
    ])

  const allTodaySessions = (sessionsResult.success ? sessionsResult.data : []) as StudioSession[]
  const todaySessions = allTodaySessions.filter((s) => dayKey(s.scheduled_at) === today)
  const projects: ProjectSummary[] = projectsResult.success ? projectsResult.data : []
  const team: TeamMember[] = (teamResult.success ? teamResult.data : []).filter(
    (m) => m.status === 'active'
  )
  const consents = consentsResult.success ? consentsResult.data : []
  const clients = clientsResult.success ? clientsResult.data : []

  const projectsById = new Map(projects.map((p) => [p.id, p]))
  const consentedProjectIds = new Set(consents.filter((c) => c.signed_at).map((c) => c.project_id))

  // --- Por tatuador: agenda de hoy, ingreso proyectado, estado puntual ---
  const teamToday: ArtistToday[] = team.map((member) => {
    const sessions = todaySessions
      .filter((s) => s.artist_id === member.id && s.status !== 'cancelled')
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))

    const projectedIncome = sessions.reduce((sum, s) => {
      const p = projectsById.get(s.project_id)
      return sum + (p?.total_value ?? 0)
    }, 0)

    if (sessions.length === 0) {
      return {
        artistId: member.id,
        name: member.name,
        presence: 'off',
        sessionCount: 0,
        projectedIncome: 0,
        sessions: [],
        status: 'off',
        scheduleLabel: 'Todo el día',
        nextLabel: null,
      }
    }

    // sessions.length === 0 ya retornó arriba, así que index 0 y el
    // último índice siempre existen aquí.
    const first = sessions[0]!
    const last = sessions[sessions.length - 1]!
    const inSessionNow = sessions.find((s) => {
      const start = new Date(s.scheduled_at).getTime()
      const end = start + (s.duration_minutes ?? 60) * 60000
      return scheduleNowMs >= start && scheduleNowMs < end
    })
    const upcoming = sessions.find((s) => new Date(s.scheduled_at).getTime() > scheduleNowMs)

    let status: ArtistToday['status'] = 'available'
    let nextLabel: string | null = null
    if (inSessionNow) {
      status = 'in_session'
      nextLabel = null
    } else if (upcoming) {
      status = sessions[0] === upcoming && scheduleNowMs < new Date(first.scheduled_at).getTime() ? 'next_appointment' : 'available'
      nextLabel = timeLabel(upcoming.scheduled_at)
    }

    return {
      artistId: member.id,
      name: member.name,
      presence: 'working',
      sessionCount: sessions.length,
      projectedIncome,
      sessions,
      status,
      scheduleLabel: `${timeLabel(first.scheduled_at)} – ${timeLabel(last.scheduled_at)}`,
      nextLabel,
    }
  })

  const daySummaryData = daySummary(todaySessions, projects)

  const citasHoy = todaySessions.filter((s) => s.status !== 'cancelled').length
  const tatuadoresActivos = teamToday.filter((t) => t.presence === 'working').length
  const pendientes = todaySessions.filter((s) => s.status === 'rescheduled').length
  const canceladas = todaySessions.filter((s) => s.status === 'cancelled').length

  // --- Alertas: solo se listan si existen ---
  const alerts: AgendaAlert[] = []
  for (const s of todaySessions) {
    if (s.status === 'cancelled') continue
    const artistName = s.artists?.name ?? 'Sin asignar'
    if (!consentedProjectIds.has(s.project_id)) {
      alerts.push({
        id: `consent-${s.id}`,
        kind: 'missing_consent',
        artistName,
        message: `${artistName} tiene una cita sin consentimiento firmado.`,
        detail: `${s.projects?.name ?? 'Sesión'} a las ${timeLabel(s.scheduled_at)}.`,
      })
    }
    const project = projectsById.get(s.project_id)
    if (project && Math.max(0, calculateBalance(project)) > 0) {
      alerts.push({
        id: `payment-${s.id}`,
        kind: 'pending_payment',
        artistName,
        message: `${artistName} tiene un pago pendiente de ${formatCOPShort(Math.max(0, calculateBalance(project)))}.`,
        detail: `${s.projects?.name ?? 'Sesión'} a las ${timeLabel(s.scheduled_at)}.`,
      })
    }
    const minutesToStart = Math.round((new Date(s.scheduled_at).getTime() - scheduleNowMs) / 60000)
    if (minutesToStart > 0 && minutesToStart <= 15) {
      alerts.push({
        id: `soon-${s.id}`,
        kind: 'starting_soon',
        artistName,
        message: `${artistName} tiene una cita en ${minutesToStart} minutos.`,
        detail: `${s.projects?.clients?.name ?? 'Cliente'} — ${s.projects?.name ?? 'Sesión'}.`,
      })
    }
  }

  // --- Actividad reciente: últimas citas agendadas, clientes y pagos ---
  const recentActivity: RecentActivityItem[] = []
  for (const s of allTodaySessions) {
    recentActivity.push({
      id: `session-${s.id}`,
      message: `${s.artists?.name ?? 'Un tatuador'} agendó una cita`,
      detail: `${s.projects?.name ?? 'Sesión'} con ${s.projects?.clients?.name ?? 'cliente'}`,
      at: s.created_at,
    })
  }
  for (const c of clients) {
    recentActivity.push({
      id: `client-${c.id}`,
      message: 'Nuevo cliente registrado',
      detail: c.name,
      at: c.created_at,
    })
  }
  for (const p of projects) {
    for (const pay of p.payments) {
      recentActivity.push({
        id: `payment-${p.id}-${pay.paid_at}-${pay.amount}`,
        message: 'Pago registrado',
        detail: `${formatCOPShort(pay.amount)} de ${p.clients?.name ?? 'cliente'}`,
        at: pay.paid_at,
      })
    }
  }
  recentActivity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  return {
    studioName,
    todaySessions,
    team: teamToday,
    daySummaryData,
    citasHoy,
    tatuadoresActivos,
    pendientes,
    canceladas,
    alerts,
    recentActivity: recentActivity.slice(0, 5).map((item) => ({
      ...item,
      detail: `${item.detail} · ${relativeLabel(item.at, nowMs)}`,
    })),
    unreadNotifications,
  }
}
