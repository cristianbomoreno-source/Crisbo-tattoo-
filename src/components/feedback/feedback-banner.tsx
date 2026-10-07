import Link from 'next/link'
import { Star, ArrowRight } from 'lucide-react'
import { getMyFeedbackProgress } from '@/actions/feedback'

/**
 * Mensaje "de parte de OFINK" en la parte superior de Ajustes, invitando a
 * calificar cada función de la app. Desaparece solo cuando ya calificó
 * TODAS las funciones — mientras tanto muestra cuántas le faltan.
 */
export async function FeedbackBanner() {
  const result = await getMyFeedbackProgress()
  if (!result.success) return null
  const { rated, total } = result.data
  if (rated >= total) return null

  const pct = total > 0 ? Math.round((rated / total) * 100) : 0

  return (
    <Link
      href="/dashboard/settings/feedback"
      className="mb-5 flex items-center gap-3.5 rounded-2xl border border-primary/25 bg-card p-4 transition-colors hover:bg-accent/60"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Star className="size-5" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Mensaje de OFINK</p>
        <p className="mt-0.5 text-sm">
          {rated === 0
            ? 'Ayúdanos a mejorar: califica cada función de la app.'
            : `Te faltan ${total - rated} funciones por calificar.`}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-background">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </Link>
  )
}
