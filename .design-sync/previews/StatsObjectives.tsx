import { StatsObjectives } from 'crisbo-tattoo'

export const ConMetas = () => (
  <div className="max-w-md">
    <StatsObjectives quotedValue={8400000} quotedGoal={10000000} approvedCount={14} approvedGoal={12} scheduledSessions={18} sessionsGoal={25} />
  </div>
)

export const SinMetas = () => (
  <div className="max-w-md">
    <StatsObjectives quotedValue={0} quotedGoal={null} approvedCount={0} approvedGoal={null} scheduledSessions={0} sessionsGoal={null} />
  </div>
)
