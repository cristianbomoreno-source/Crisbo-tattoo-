import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { getStudioSessions } from '@/queries/sessions'
import { listTeam } from '@/actions/team'
import { PageHeader } from '@/components/shared/page-header'
import { StudioCalendar } from '@/components/studio/studio-calendar'
import { todayKey } from '@/lib/calendar/utils'

export default async function StudioCalendarPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner' || studio.accountKind !== 'estudio') {
    redirect('/dashboard')
  }

  const today = todayKey()
  const from = `${today}T00:00:00.000Z`
  const toD = new Date(`${today}T00:00:00.000Z`)
  toD.setUTCDate(toD.getUTCDate() + 21)

  const [sessionsResult, teamResult] = await Promise.all([
    getStudioSessions(from, toD.toISOString()),
    listTeam(),
  ])

  return (
    <div>
      <PageHeader kicker={studio.accountKind === 'estudio' ? 'Estudio' : 'Tatuador'} title="Calendario general" />
      <StudioCalendar
        sessions={sessionsResult.success ? sessionsResult.data : []}
        team={(teamResult.success ? teamResult.data : []).filter((m) => m.status === 'active')}
      />
    </div>
  )
}
