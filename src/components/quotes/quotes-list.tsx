'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/empty-state'
import { STATUS_CONFIG, DOT, type Tone } from '@/components/shared/status-badge'
import { SwipeToDeleteRow, SwipeToDeleteGroup } from '@/components/shared/swipe-to-delete-row'
import { RemotePhoto } from '@/components/shared/remote-photo'
import { BotBadge } from '@/components/quotes/bot-badge'
import { QuoteDetailDialog, type QuoteForDialog } from '@/components/quotes/quote-detail-dialog'
import { deleteQuoteAction } from '@/actions/quotes'
import { cn } from '@/lib/utils'

/** "Hace 2 días", "Hace 3 h", "Hace 12 min". */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'Justo ahora'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h} h`
  const d = Math.floor(h / 24)
  return `Hace ${d} día${d === 1 ? '' : 's'}`
}

function formatHour(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

/**
 * Lista de tarjetas de cotización. Antes cada tarjeta era un <Link> que
 * navegaba a /dashboard/quotes/[id]; ahora abre QuoteDetailDialog (popup) —
 * la página [id] se conserva para el link del wizard al crear una cotización
 * nueva, pero ya no es el flujo principal de "ver una cotización".
 */
export function QuotesList({
  quotes,
  quoteMessageTemplate,
  depositMode,
  depositValue,
}: {
  quotes: QuoteForDialog[]
  quoteMessageTemplate?: string | null
  depositMode?: string | null
  depositValue?: number | null
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<QuoteForDialog | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSwipeDelete(id: string, clientLabel: string) {
    setDeletingId(id)
    const result = await deleteQuoteAction(id)
    setDeletingId(null)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success(`Cotización de ${clientLabel} eliminada`)
    router.refresh()
  }

  if (quotes.length === 0) {
    return <EmptyState title="No hay cotizaciones" description="Crea tu primera cotización para un cliente." />
  }

  return (
    <SwipeToDeleteGroup>
    <div className="grid gap-3" data-tour="quotes-list">
      {quotes.map((q, i) => {
        const isGreen = i % 2 === 0
        const config = STATUS_CONFIG[q.status] ?? { label: q.status, tone: 'process' as Tone }
        const meta = [q.style, q.description, q.body_zone].filter(Boolean).join(' • ')

        return (
          <SwipeToDeleteRow
            key={q.id}
            disabled={deletingId === q.id}
            onDelete={() => handleSwipeDelete(q.id, q.clients?.name ?? 'cliente')}
          >
          <button
            type="button"
            onClick={() => setSelected(q)}
            className="group block w-full min-w-0 text-left"
          >
            <div
              className={cn(
                'relative isolate flex aspect-[16/7.5] w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl p-4',
                isGreen
                  ? 'ring-1 ring-primary/40 shadow-[0_0_28px_-6px_var(--primary-glow,_rgba(184,244,0,0.18))]'
                  : 'ring-1 ring-white/10'
              )}
            >
              {q.photoUrl ? (
                <RemotePhoto
                  src={q.photoUrl}
                  width={800}
                  className={cn(
                    'absolute inset-0 size-full object-cover grayscale',
                    isGreen ? 'contrast-125 brightness-75' : 'contrast-110 brightness-90'
                  )}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
              )}
              {isGreen && q.photoUrl && (
                <div className="absolute inset-0 bg-primary opacity-60 mix-blend-color" aria-hidden />
              )}
              <div
                className="absolute inset-0 bg-black/65"
                aria-hidden
              />
              {q.style && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none">
                  <span className="block w-full max-w-full truncate text-center font-title text-7xl leading-none tracking-tight text-white uppercase opacity-[0.13] sm:text-8xl">
                    {q.style}
                  </span>
                </div>
              )}

              <div className="relative z-10 flex items-start justify-between gap-3">
                <BotBadge source={q.source} />
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1 font-display text-[11px] font-medium tracking-wider text-white uppercase',
                    config.tone === 'active' && 'border-primary/40'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', DOT[config.tone])} />
                  {config.label}
                </span>
              </div>

              <div className="relative z-10 min-w-0 pr-14">
                <h3 className="truncate font-title text-4xl leading-none tracking-tight text-white uppercase sm:text-5xl">
                  {q.clients?.name ?? 'Cliente'}
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  {timeAgo(q.created_at)} • {formatHour(q.created_at)}
                </p>
                {meta && <p className="mt-0.5 truncate text-sm text-white/85">{meta}</p>}
              </div>

              <div className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/70">
                  <ChevronRight
                    className="size-5 text-white"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </div>
          </button>
          </SwipeToDeleteRow>
        )
      })}

      <QuoteDetailDialog
        quote={selected}
        quoteMessageTemplate={quoteMessageTemplate}
        depositMode={depositMode}
        depositValue={depositValue}
        onClose={() => setSelected(null)}
      />
    </div>
    </SwipeToDeleteGroup>
  )
}
