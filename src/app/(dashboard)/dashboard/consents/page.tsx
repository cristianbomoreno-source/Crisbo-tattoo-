import { getConsents } from '@/queries/consents'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ConsentCard } from '@/components/consents/consent-card'

export default async function ConsentsPage() {
  const result = await getConsents()
  const consents = result.success ? result.data : []

  return (
    <div>
      <PageHeader title="Consentimientos" description="Historial de consentimientos firmados" />
      {consents.length === 0 ? (
        <EmptyState title="No hay consentimientos" description="Los consentimientos se generan desde Inicio, el día de la cita." />
      ) : (
        <div className="grid gap-3">
          {consents.map((c) => (
            <ConsentCard
              key={c.id}
              id={c.id}
              linkId={c.consent_links?.[0]?.id ?? null}
              projectName={c.projects?.name ?? 'Proyecto'}
              clientName={c.clients?.name ?? 'Cliente'}
              signedAt={c.signed_at}
            />
          ))}
        </div>
      )}
    </div>
  )
}
