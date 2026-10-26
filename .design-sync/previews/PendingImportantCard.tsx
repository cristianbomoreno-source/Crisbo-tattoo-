import { PendingImportantCard } from 'crisbo-tattoo'

export const ConPendientes = () => (
  <div className="max-w-md">
    <PendingImportantCard pendingQuotes={3} pendingConsents={1} unscheduledApproved={2} />
  </div>
)

export const AlDia = () => (
  <div className="max-w-md">
    <PendingImportantCard pendingQuotes={0} pendingConsents={0} unscheduledApproved={0} />
  </div>
)
