import { getPublicConsentLink } from '@/queries/consent-links'
import { PublicConsentForm } from '@/components/consents/public-consent-form'

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-card p-6 text-center">
      <h1 className="font-display text-xl font-medium uppercase">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

export default async function PublicConsentPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await getPublicConsentLink(token)

  if (!result.success) {
    return <Message title="Enlace no válido" body="Este enlace de consentimiento no existe." />
  }

  const link = result.data
  if (link.status === 'signed') {
    return <Message title="Ya firmado" body="Este consentimiento ya fue firmado. ¡Gracias!" />
  }
  if (link.status === 'revoked') {
    return <Message title="Enlace anulado" body="Pídele al estudio un nuevo enlace." />
  }
  if (link.expired) {
    return <Message title="Enlace expirado" body="Este enlace expiró. Pídele al estudio uno nuevo." />
  }

  return (
    <PublicConsentForm
      token={token}
      studioName={link.studioName}
      client={link.client}
      project={link.project}
      templateContent={link.templateContent}
    />
  )
}
