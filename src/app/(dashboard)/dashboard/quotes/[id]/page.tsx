import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { getQuote } from '@/queries/quotes'
import { getCurrentStudio } from '@/queries/studio'
import { getProjectIdByQuoteId } from '@/queries/projects'
import { createClient } from '@/lib/supabase/server'
import { QuoteDetailContent } from '@/components/quotes/quote-detail-content'
import { notFound } from 'next/navigation'

/**
 * Página standalone de una cotización — ya no es el flujo principal (la
 * lista abre esto mismo en un popup, ver quotes-list.tsx), pero se conserva
 * como ruta real porque el wizard de creación enlaza acá al terminar
 * (step-summary.tsx) y las acciones de mutación revalidan esta ruta.
 * Mismo componente visual que el popup (quote-detail-content.tsx), con
 * cabecera de página en vez de chrome de diálogo.
 */
export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getQuote(id)

  if (!result.success) notFound()

  const q = result.data
  const studio = await getCurrentStudio()
  const projectIdResult = q.status === 'approved' ? await getProjectIdByQuoteId(q.id) : null
  const projectId = projectIdResult?.success ? projectIdResult.data : null

  const supabase = await createClient()
  const publicUrl = (path: string) => supabase.storage.from('quote-photos').getPublicUrl(path).data.publicUrl
  const photoUrl = q.reference_photo_path ? publicUrl(q.reference_photo_path) : null
  const referencePhotos = [q.reference_photo_path, ...(q.extra_photo_paths ?? [])]
    .filter((p): p is string => Boolean(p))
    .map(publicUrl)

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/dashboard/quotes"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2} />
        Cotizaciones
      </Link>
      <div className="overflow-hidden rounded-3xl bg-card">
        <QuoteDetailContent
          quote={q}
          photoUrl={photoUrl}
          referencePhotos={referencePhotos}
          quoteMessageTemplate={studio?.quoteMessageTemplate}
          depositMode={studio?.depositMode}
          depositValue={studio?.depositValue}
          projectId={projectId}
        />
      </div>
    </div>
  )
}
