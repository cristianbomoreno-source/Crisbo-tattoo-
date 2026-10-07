import { getQuotes } from '@/queries/quotes'
import { getClients } from '@/queries/clients'
import { getCurrentStudio } from '@/queries/studio'
import { getProjectIdsByQuoteIds } from '@/queries/projects'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { CreateQuoteDialog } from '@/components/quotes/create-quote-dialog'
import { QuotesList } from '@/components/quotes/quotes-list'
import type { QuoteForDialog } from '@/components/quotes/quote-detail-dialog'

export default async function QuotesPage() {
  const result = await getQuotes()
  const quotes = result.success ? result.data : []

  const clientsResult = await getClients()
  const clients = clientsResult.success ? clientsResult.data : []
  const studio = await getCurrentStudio()

  // Mismo patrón que el detalle de cotización: resolver las rutas guardadas
  // en `reference_photo_path` / `extra_photo_paths` a URLs públicas del
  // bucket `quote-photos`. Se resuelve acá (server) una sola vez y se manda
  // ya listo al componente cliente que abre el popup — sin fetch extra al
  // abrir cada cotización.
  const supabase = await createClient()
  const publicUrl = (path: string) => supabase.storage.from('quote-photos').getPublicUrl(path).data.publicUrl

  const approvedIds = quotes.filter(q => q.status === 'approved').map(q => q.id)
  const projectIdsResult = await getProjectIdsByQuoteIds(approvedIds)
  const projectIds = projectIdsResult.success ? projectIdsResult.data : {}

  const quotesForDialog: QuoteForDialog[] = quotes.map((q) => ({
    ...q,
    photoUrl: q.reference_photo_path ? publicUrl(q.reference_photo_path) : null,
    referencePhotos: [q.reference_photo_path, ...(q.extra_photo_paths ?? [])]
      .filter((p): p is string => Boolean(p))
      .map(publicUrl),
    projectId: projectIds[q.id] ?? null,
  }))

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        action={
          <div className="hidden lg:block" data-tour="quote-create-desktop">
            <CreateQuoteDialog clients={clients} quoteMessageTemplate={studio?.quoteMessageTemplate} />
          </div>
        }
      />
      <QuotesList
        quotes={quotesForDialog}
        quoteMessageTemplate={studio?.quoteMessageTemplate}
        depositMode={studio?.depositMode ?? null}
        depositValue={studio?.depositValue ?? null}
      />
    </div>
  )
}
