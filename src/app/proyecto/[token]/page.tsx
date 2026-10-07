import type { Metadata } from 'next'
import { getPublicQuoteProject } from '@/queries/quote-links'
import { QuoteLanding } from '@/components/quote-landing/quote-landing'
import { Logo } from '@/components/shared/logo'

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo full className="text-xl" />
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <h1 className="font-display text-xl font-medium uppercase text-white">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const result = await getPublicQuoteProject(token)
  if (!result.success) return { title: 'Proyecto no encontrado' }

  const { quote } = result.data
  const title = `${quote.clientName}, este es tu proyecto`
  const description = 'Preparé cada detalle pensando en la idea que quieres llevar en tu piel.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/quote-links/${token}/image`, width: 1080, height: 2480 }],
    },
  }
}

export default async function ProjectLandingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await getPublicQuoteProject(token)

  if (!result.success) {
    const expired = result.error.code === 'VALIDATION_ERROR'
    return expired ? (
      <Message title="Enlace expirado" body="Este proyecto ya no está disponible. Pídele al estudio un nuevo enlace." />
    ) : (
      <Message title="Enlace no válido" body="Este proyecto no existe." />
    )
  }

  return <QuoteLanding data={result.data} />
}
