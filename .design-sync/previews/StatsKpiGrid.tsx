import { StatsKpiGrid } from 'crisbo-tattoo'

const quoted = [0, 300, 0, 800, 200, 0, 0, 1200, 400, 0, 0, 600, 900, 0, 300, 0, 0, 1500, 200, 0, 700, 0, 0, 400, 1100, 300, 0, 0, 0, 0, 0].map((v) => v * 1000)
const sessions = [0, 1, 2, 0, 0, 1, 1, 2, 0, 1, 0, 0, 2, 1, 1, 0, 0, 1, 2, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0]

export const MesEnCurso = () => (
  <div className="max-w-md">
    <StatsKpiGrid
      quotedValue={8400000}
      prevQuotedValue={7100000}
      dailyQuoted={quoted}
      expectedIncome={5200000}
      confirmedIncome={2675000}
      pendingApprovalValue={1800000}
      pendingCount={6}
      scheduledSessions={18}
      prevScheduledSessions={21}
      dailySessions={sessions}
      upToIndex={25}
      occupancyPct={64}
      daysWithSessionOpen={14}
      workableDays={22}
      averageTicket={620000}
      prevAverageTicket={580000}
    />
  </div>
)
