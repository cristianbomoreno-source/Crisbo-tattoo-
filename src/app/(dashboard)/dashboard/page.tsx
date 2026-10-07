import { getCurrentStudio } from '@/queries/studio'
import { getSessions } from '@/queries/sessions'
import { getProjects } from '@/queries/projects'
import { getBlockedDayKeys, getBlockedDays } from '@/queries/blocked-days'
import { getProjectIdsWithMedicalAlert } from '@/queries/consent-links'
import { getProjectIdsWithSignedConsent } from '@/queries/consents'
import { getActiveWorkShift, getActiveSessionShifts } from '@/queries/work-shifts'
import { getQuotes } from '@/queries/quotes'
import { getConsents } from '@/queries/consents'
import { getInventoryItems, type InventoryItem } from '@/queries/inventory'
import { getFixedExpenses } from '@/queries/expenses'
import { getStudioHomeData } from '@/queries/studio-home'
import { HomeGreeting } from '@/components/home/home-greeting'
import { OnboardingChecklist } from '@/components/home/onboarding-checklist'
import { TodayCards } from '@/components/home/today-cards'
import { DaySummary } from '@/components/home/day-summary'
import { TodayAppointments, type ProjectBalance } from '@/components/home/today-appointments'
import { CalendarCard } from '@/components/home/calendar-card'
import { NextSessionCard } from '@/components/home/next-session-card'
import { ExpenseAlertsCard } from '@/components/home/expense-alerts-card'
import { HomeDesktopGate } from '@/components/home/home-responsive'
import { RestDayGate } from '@/components/home/rest-day-gate'
import { EstudioHome } from '@/components/home/estudio/estudio-home'
import { todayKey, getMonthKeys, dayKey, TZ, nowAsWallClock, expandClosedWeekdays } from '@/lib/calendar/utils'
import { greetingWord } from '@/lib/home/month-metrics'
import { daySummary } from '@/lib/home/day-metrics'
import { calculateBalance } from '@/lib/projects/metrics'
import { weekCounts } from '@/lib/home/metrics'
import { calculateUpcomingExpenseAlerts, type UpcomingExpenseAlert } from '@/lib/finance/alerts'

export default async function DashboardPage() {
  const today = todayKey()
  const monthDays = getMonthKeys(today)

  // Ventana ±1 día alrededor del mes completo (absorbe el offset de TZ Bogotá;
  // la tira de "Calendario" ahora se desliza por todo el mes, no solo la semana).
  const fromD = new Date(`${monthDays[0]}T00:00:00Z`)
  fromD.setUTCDate(fromD.getUTCDate() - 1)
  const toD = new Date(`${monthDays[monthDays.length - 1]}T00:00:00Z`)
  toD.setUTCDate(toD.getUTCDate() + 2)

  const [studio, sessionsResult, projectsResult, blockedDateKeys] = await Promise.all([
    getCurrentStudio(),
    getSessions(fromD.toISOString(), toD.toISOString()),
    getProjects(),
    getBlockedDayKeys(fromD.toISOString(), toD.toISOString()),
  ])
  const sessions = sessionsResult.success ? sessionsResult.data : []
  const projects = projectsResult.success ? projectsResult.data : []

  // Antes el calendario solo pintaba/bloqueaba las fechas puntuales de
  // `blocked_days` (Ajustes → Fechas especiales) — un día de la semana
  // marcado como "no laboral" en Ajustes → Horario (open_days) no se
  // reflejaba acá, así que se podía agendar un domingo aunque el estudio
  // no trabajara los domingos. Se fusionan ambas fuentes en un solo set.
  const closedWeekdayKeys = expandClosedWeekdays(
    fromD.toISOString().slice(0, 10),
    toD.toISOString().slice(0, 10),
    studio?.openDays
  )
  const blockedKeys = Array.from(new Set([...blockedDateKeys, ...closedWeekdayKeys]))

  // Fechas especiales (Ajustes → Estudio): si hoy está bloqueado, Inicio
  // se tapa con RestDayGate hasta que se pulse "Acceder".
  const isRestDay = blockedKeys.includes(today)
  let restDayReason: string | null = null
  if (isRestDay) {
    const restDayResult = await getBlockedDays(today, today)
    restDayReason = restDayResult.success ? restDayResult.data[0]?.reason ?? null : null
  }

  const hour = Number(
    new Intl.DateTimeFormat('es-CO', { timeZone: TZ, hour: 'numeric', hour12: false }).format(
      new Date()
    )
  )
  const dateLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TZ,
  })
  const days = weekCounts(monthDays, sessions)

  // Cuenta de Estudio (dueño): dashboard completamente distinto — ver
  // src/components/home/estudio/estudio-home.tsx. Cuentas de Tatuador
  // Independiente (y members del estudio) siguen con el Home de siempre,
  // más abajo, sin ningún cambio.
  if (studio && studio.accountKind === 'estudio' && studio.role === 'owner') {
    const estudioData = await getStudioHomeData(studio.name)
    const estudioHome = (
      <EstudioHome
        studio={studio}
        data={estudioData}
        greeting={greetingWord(hour)}
        dateLabel={dateLabel}
        days={days}
        today={today}
        blockedKeys={blockedKeys}
      />
    )
    // BUG REAL corregido: RestDayGate envolvía esto SIEMPRE, sin mirar
    // `isRestDay` — la pantalla "Hoy es tu día de descanso" aparecía todos
    // los días (incluso laborales) hasta tocar "Acceder", que solo la
    // silencia para ese día puntual en ese navegador. Ahora solo se envuelve
    // cuando hoy de verdad está bloqueado (fecha especial o día no laboral).
    return isRestDay ? (
      <RestDayGate date={today} reason={restDayReason}>
        {estudioHome}
      </RestDayGate>
    ) : (
      estudioHome
    )
  }

  // Solo para el Home de iPad/escritorio (`HomeDesktop`) — datos que ya
  // existen en otras pantallas (Cotizaciones, Consentimientos), nada nuevo.
  // Envuelto en try/catch: si algo de esto llegara a lanzar una excepción
  // (en vez de devolver un Result con success:false), antes tumbaba TODA
  // la página de Inicio — con esto, en el peor caso el móvil simplemente
  // no muestra "Pendientes importantes"/la jornada, pero el resto de
  // Inicio sigue funcionando normal.
  let activeShift: { id: string; startedAt: string } | null = null
  let pendingQuotes = 0
  let pendingConsents = 0
  let activeSessionShifts: Record<string, { id: string; startedAt: string }> = {}
  let inventoryItems: InventoryItem[] = []
  let expenseAlerts: UpcomingExpenseAlert[] = []
  try {
    const [activeShiftResult, quotesResult, consentsResult, sessionShiftsResult, inventoryResult, fixedExpensesResult] =
      await Promise.all([
        studio ? getActiveWorkShift(studio.artistId) : null,
        getQuotes(),
        getConsents(),
        studio ? getActiveSessionShifts(studio.artistId) : null,
        getInventoryItems(),
        getFixedExpenses(),
      ])
    activeShift = activeShiftResult?.success ? activeShiftResult.data : null
    const quotes = quotesResult?.success ? quotesResult.data : []
    const consents = consentsResult?.success ? consentsResult.data : []
    pendingQuotes = quotes.filter((q) => q.status === 'new').length
    pendingConsents = consents.filter((c) => !c.signed_at).length
    activeSessionShifts = sessionShiftsResult?.success ? sessionShiftsResult.data : {}
    inventoryItems = inventoryResult.success ? inventoryResult.data : []

    // Calcular alertas de gastos fijos
    if (fixedExpensesResult.success) {
      const fixedExpenses = fixedExpensesResult.data
        .filter((e) => e.due_day !== null)
        .map((e) => ({
          id: e.id,
          name: e.category,
          amount: e.amount,
          due_day: e.due_day!,
        }))
      expenseAlerts = calculateUpcomingExpenseAlerts(fixedExpenses, 0)
    }
  } catch (e) {
    console.error('[home] datos extra de escritorio fallaron, se ignoran', e)
  }
  const unscheduledApproved = projects.filter((p) => p.status === 'approval').length

  const todaySessions = sessions.filter(
    (s) => s.status !== 'cancelled' && dayKey(s.scheduled_at) === today
  )
  const medicalAlertProjectIds = await getProjectIdsWithMedicalAlert(
    [...new Set(todaySessions.map((s) => s.project_id))]
  )
  const consentSignedProjectIds = await getProjectIdsWithSignedConsent(
    [...new Set(todaySessions.map((s) => s.project_id))]
  )

  const citasHoy = todaySessions.length
  const clientesHoy = new Set(
    todaySessions.map((s) => s.projects?.clients?.name).filter(Boolean)
  ).size
  const horasHoy = Math.round(
    (todaySessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60) * 10
  ) / 10
  const summary = daySummary(todaySessions, projects)

  // Saldo por proyecto (para la fila de cada cita) + mapa de proyectos por id
  // (para sacarle la última foto de galería a la próxima sesión).
  const balances: Record<string, ProjectBalance> = {}
  const projectsById: Record<string, (typeof projects)[number]> = {}
  for (const p of projects) {
    const deposits = p.payments.reduce((sum, x) => sum + (x.amount ?? 0), 0)
    balances[p.id] = { deposits, pending: Math.max(0, calculateBalance(p)) }
    projectsById[p.id] = p
  }

  // Sesiones de HOY ordenadas por hora, con la foto más reciente de cada
  // proyecto — la tarjeta "Próxima sesión" desliza entre todas ellas.
  const todayOrdered = [...todaySessions].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )
  const nowMs = nowAsWallClock().getTime()
  // Prioridad: 1) la sesión que está en curso justo ahora (hora actual entre
  // inicio y fin), 2) si ninguna está en curso, la próxima futura, 3) si ya
  // pasaron todas, la última del día.
  const inProgressIndex = todayOrdered.findIndex((s) => {
    const start = new Date(s.scheduled_at).getTime()
    const end = start + (s.duration_minutes ?? 60) * 60000
    return nowMs >= start && nowMs < end
  })
  const nextIndex = todayOrdered.findIndex((s) => new Date(s.scheduled_at).getTime() >= nowMs)
  const initialIndex =
    inProgressIndex >= 0 ? inProgressIndex : nextIndex >= 0 ? nextIndex : todayOrdered.length - 1
  const photoUrls: Record<string, string | null> = {}
  for (const s of todayOrdered) {
    const g = projectsById[s.project_id]?.gallery
    photoUrls[s.id] = g?.length
      ? [...g].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]!
          .url
      : null
  }

  const mobileHome = (
    <div className="space-y-3.5">
      <div data-tour="home-greeting">
        <HomeGreeting
          name={studio?.artistName ?? null}
          greeting={greetingWord(hour)}
          dateLabel={dateLabel}
          logoUrl={studio?.logoUrl}
        />
      </div>

      <OnboardingChecklist stepsDone={studio?.onboardingStepsDone ?? []} />

      <CalendarCard
        days={days}
        today={today}
        todaySessions={todaySessions}
        balances={balances}
        blockedDays={blockedKeys}
      />

      {todayOrdered.length > 0 && (
        <NextSessionCard
          sessions={todayOrdered}
          photoUrls={photoUrls}
          initialIndex={initialIndex}
          template={studio?.reminderSessionTemplate}
          inventoryItems={inventoryItems}
          activeShifts={activeSessionShifts}
          consentSignedProjectIds={consentSignedProjectIds}
        />
      )}

      <TodayCards citasHoy={citasHoy} clientesHoy={clientesHoy} horasHoy={horasHoy} />

      <DaySummary
        summary={summary}
        projects={projects}
        todaySessions={todaySessions}
        paymentMethods={studio?.paymentMethods}
      />

      {expenseAlerts.length > 0 && (
        <ExpenseAlertsCard alerts={expenseAlerts} />
      )}

      <section className="space-y-2" data-tour="home-today-sessions">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Sesiones de hoy</h2>
          <a
            href="/dashboard?openCalendar=1"
            className="text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver agenda →
          </a>
        </div>
        <TodayAppointments
          sessions={todaySessions}
          balances={balances}
          medicalAlertProjectIds={medicalAlertProjectIds}
          consentSignedProjectIds={consentSignedProjectIds}
        />
      </section>
    </div>
  )

  const homeContent = (
    <>
      {/* Móvil: se renderiza siempre, directo, sin pasar por ningún gate ni
          depender de JS — exactamente como antes de que existiera la
          versión de escritorio. `md:hidden` es solo presentación. */}
      <div className="md:hidden">{mobileHome}</div>

      {/* iPad/escritorio: `HomeDesktopGate` decide en el cliente si monta
          `HomeDesktop` — nunca se monta en un teléfono, ni siquiera oculto. */}
      <div className="hidden md:block">
        <HomeDesktopGate
          name={studio?.artistName ?? null}
          greeting={greetingWord(hour)}
          dateLabel={dateLabel}
          coverPhotoUrl={studio?.coverPhotoUrl ?? null}
          activeShift={activeShift}
          todayOrdered={todayOrdered}
          photoUrls={photoUrls}
          initialIndex={initialIndex}
          reminderSessionTemplate={studio?.reminderSessionTemplate}
          days={days}
          today={today}
          todaySessions={todaySessions}
          balances={balances}
          blockedDays={blockedKeys}
          summary={summary}
          pendingQuotes={pendingQuotes}
          pendingConsents={pendingConsents}
          unscheduledApproved={unscheduledApproved}
          inventoryItems={inventoryItems}
          activeSessionShifts={activeSessionShifts}
          projects={projects}
          paymentMethods={studio?.paymentMethods}
          medicalAlertProjectIds={medicalAlertProjectIds}
          consentSignedProjectIds={consentSignedProjectIds}
          expenseAlerts={expenseAlerts}
        />
      </div>
    </>
  )

  // BUG REAL corregido: igual que en el home de Estudio, RestDayGate se
  // aplicaba SIEMPRE sin mirar `isRestDay` — por eso la pantalla de
  // descanso salía todos los días, sin importar si el día estaba
  // realmente bloqueado. Solo se envuelve cuando sí lo está.
  return isRestDay ? (
    <RestDayGate date={today} reason={restDayReason}>
      {homeContent}
    </RestDayGate>
  ) : (
    homeContent
  )
}
