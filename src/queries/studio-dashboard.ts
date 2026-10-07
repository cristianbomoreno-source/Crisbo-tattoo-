import { getProjects, type ProjectSummary } from '@/queries/projects'
import { getStudioSessions } from '@/queries/sessions'
import { listTeam } from '@/actions/team'
import { todayKey } from '@/lib/calendar/utils'

export type ArtistRanking = {
  artistId: string
  name: string
  billed: number
  activeProjects: number
  completedProjects: number
}

export type StudioDashboardData = {
  teamSize: number
  billedThisMonth: number
  pendingThisMonth: number
  activeProjects: number
  sessionsToday: number
  newClientsThisMonth: number
  ranking: ArtistRanking[]
}

function isThisMonth(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

/** Agregados del estudio completo — solo tiene sentido para el owner (las
 * queries de base ya devuelven todo el estudio para ese rol, sin filtro). */
export async function getStudioDashboardData(): Promise<StudioDashboardData> {
  const today = todayKey()
  const dayStart = `${today}T00:00:00.000Z`
  const dayEnd = `${today}T23:59:59.999Z`

  const [projectsResult, sessionsResult, teamResult] = await Promise.all([
    getProjects(),
    getStudioSessions(dayStart, dayEnd),
    listTeam(),
  ])

  const projects: ProjectSummary[] = projectsResult.success ? projectsResult.data : []
  const sessionsToday = sessionsResult.success ? sessionsResult.data.length : 0
  const team = teamResult.success ? teamResult.data : []

  const rankingMap = new Map<string, ArtistRanking>()
  for (const member of team) {
    rankingMap.set(member.id, {
      artistId: member.id,
      name: member.name,
      billed: 0,
      activeProjects: 0,
      completedProjects: 0,
    })
  }

  let billedThisMonth = 0
  let pendingThisMonth = 0
  let activeProjects = 0

  for (const p of projects) {
    const paid = p.payments
      .filter((pay) => isThisMonth(pay.paid_at))
      .reduce((sum, pay) => sum + (pay.amount ?? 0), 0)
    billedThisMonth += paid

    if (p.status !== 'completed' && p.status !== 'quote') activeProjects += 1

    const totalPaid = p.payments.reduce((sum, pay) => sum + (pay.amount ?? 0), 0)
    if (p.total_value) pendingThisMonth += Math.max(0, p.total_value - totalPaid)

    const row = rankingMap.get(p.artist_id)
    if (row) {
      row.billed += paid
      if (p.status === 'completed') row.completedProjects += 1
      else if (p.status !== 'quote') row.activeProjects += 1
    }
  }

  return {
    teamSize: team.filter((m) => m.status === 'active').length,
    billedThisMonth,
    pendingThisMonth,
    activeProjects,
    sessionsToday,
    newClientsThisMonth: 0,
    ranking: [...rankingMap.values()].sort((a, b) => b.billed - a.billed),
  }
}
