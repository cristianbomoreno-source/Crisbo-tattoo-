import {
  FileText,
  Layers,
  Clock,
  Bot,
  PenLine,
  X,
} from 'lucide-react'

import { STATUS_CONFIG, DOT, type Tone } from '@/components/shared/status-badge'
import { ConvertQuoteButton } from '@/components/quotes/convert-quote-button'
import { EditQuoteButton } from '@/components/quotes/edit-quote-button'
import { DeleteQuoteButton } from '@/components/quotes/delete-quote-button'
import { SendQuoteWhatsapp } from '@/components/quotes/send-quote-whatsapp'
import { ScheduleSessionButton } from '@/components/quotes/schedule-session-button'
import { BotIntakeSummary } from '@/components/quotes/bot-intake-summary'
import { DEFAULT_TEMPLATE } from '@/lib/quotes/message'
import type { QuoteWithClient } from '@/queries/quotes'
import { cn } from '@/lib/utils'

function cop(n: number): string {
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

/**
 * Contenido visual completo del detalle de una cotización — mismo bloque se
 * usa dentro del popup (quote-detail-dialog.tsx) y en la página de detalle
 * standalone (quotes/[id]/page.tsx, que sigue existiendo para el link del
 * wizard al crear una cotización). Solo presentación: toda la lógica de
 * cada botón de acción vive en su propio componente, sin tocar.
 */
export function QuoteDetailContent({
  quote: q,
  photoUrl,
  referencePhotos,
  quoteMessageTemplate,
  depositMode,
  depositValue,
  projectId,
  onAfterAction,
  onClose,
}: {
  quote: QuoteWithClient
  photoUrl: string | null
  referencePhotos: string[]
  quoteMessageTemplate?: string | null
  /** Abono configurado en Ajustes ("Abono para reservar") — si el estudio lo
   * configuró, manda sobre el `deposit_percentage` propio de la cotización
   * (que solo queda como respaldo si todavía no se configuró nada). */
  depositMode?: string | null
  depositValue?: number | null
  /** Id del proyecto ya creado a partir de esta cotización — habilita el
   * botón "agregar cita" junto a la duración estimada. */
  projectId?: string | null
  /** Cierra el popup antes de navegar (p.ej. al convertir en proyecto). No-op en la página standalone. */
  onAfterAction?: () => void
  /** Botón X — solo se muestra cuando este contenido vive dentro del popup (ver quote-detail-dialog.tsx). Ausente en la página standalone. */
  onClose?: () => void
}) {
  const config = STATUS_CONFIG[q.status] ?? { label: q.status, tone: 'process' as Tone }
  const clientName = q.clients?.name ?? 'Cliente'
  const isBot = q.source === 'bot'

  const price = q.price ?? 0
  const deposit = depositMode === 'fixed' && depositValue
    ? { kind: 'fixed' as const, amount: depositValue }
    : depositMode === 'percent' && depositValue
      ? { kind: 'percent' as const, percentage: depositValue, amount: (price * depositValue) / 100 }
      : { kind: 'percent' as const, percentage: q.deposit_percentage, amount: (price * q.deposit_percentage) / 100 }

  return (
    <div>
      {/* HERO: misma foto de referencia + tratamiento que la tarjeta de la
          lista (quotes/page.tsx) — object-cover, overlay oscuro, nombre y
          estilo enormes en font-title. */}
      <div className="relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden bg-card p-4 pt-7 sm:aspect-[16/11]">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={photoUrl} alt="" className="absolute inset-0 size-full object-cover grayscale contrast-110 brightness-75" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
        )}
        <div className="absolute inset-0 bg-black/60" aria-hidden />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 font-display text-[11px] font-medium uppercase tracking-wider text-white">
            {isBot ? <Bot className="size-3" aria-hidden /> : <PenLine className="size-3" aria-hidden />}
            {isBot ? 'Desde bot' : 'Creada por mí'}
          </span>
          <div className="flex items-center gap-2">
            <DeleteQuoteButton
              quoteId={q.id}
              quoteLabel={clientName}
              iconOnly
              onDeleted={onAfterAction}
              className="size-8 rounded-full border border-white/10 bg-black/70 p-0 text-white hover:bg-black/80 hover:text-white"
            />
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white transition-colors hover:bg-black/80"
              >
                <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="relative z-10 min-w-0">
          <h2 className="truncate font-title text-5xl leading-[0.95] tracking-tight text-white uppercase sm:text-6xl">
            {clientName}
          </h2>
          {q.style && (
            <p className="truncate font-title text-3xl leading-[0.95] tracking-tight text-white/80 uppercase sm:text-4xl">
              {q.style}
            </p>
          )}
          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1 font-display text-[11px] font-medium tracking-wider text-white uppercase">
            <span className={cn('size-1.5 rounded-full', DOT[config.tone])} />
            {config.label}
          </span>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="space-y-2 p-4">
        <SendQuoteWhatsapp
          quoteId={q.id}
          clientName={clientName}
          clientPhone={q.clients?.phone ?? null}
          template={quoteMessageTemplate || DEFAULT_TEMPLATE}
          style={q.style}
          bodyZone={q.body_zone}
          price={q.price}
          isCourtesy={q.is_courtesy}
          sessionCount={q.session_count}
          className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
        />
        <div className="grid grid-cols-2 gap-2">
          <EditQuoteButton quote={q} referencePhotos={referencePhotos} className="h-10 w-full rounded-full" />
          {q.status !== 'approved' ? (
            <ConvertQuoteButton
              quoteId={q.id}
              label="Convertir"
              onConverted={onAfterAction}
              className="h-10 w-full rounded-full"
            />
          ) : (
            <div />
          )}
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4">
        {/* RESUMEN */}
        <div className="rounded-2xl bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileText className="size-4" strokeWidth={1.8} aria-hidden />
            Resumen
          </h3>
          <div className="flex flex-wrap items-stretch gap-2">
            <div className="flex-1 rounded-xl bg-muted/60 p-3">
              <p className="font-title text-3xl leading-none tracking-tight text-foreground tabular-nums">
                {q.is_courtesy ? 'Cortesía' : cop(q.price ?? 0)}
              </p>
            </div>
            {!q.is_courtesy && (
              <div className="rounded-xl bg-muted/60 p-3 text-right">
                <span className="text-xs text-muted-foreground">Abono</span>
                {deposit.kind === 'fixed' ? (
                  <p className="font-display text-base font-semibold tabular-nums">{cop(deposit.amount)}</p>
                ) : (
                  <>
                    <p className="font-display text-base font-semibold tabular-nums">
                      {deposit.percentage}%
                    </p>
                    <span className="text-xs text-muted-foreground tabular-nums">({cop(deposit.amount)})</span>
                  </>
                )}
              </div>
            )}
          </div>
          {(q.session_count != null || q.avg_session_duration) && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {q.session_count != null && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3">
                  <Layers className="size-4 text-primary" strokeWidth={1.8} aria-hidden />
                  <div>
                    <p className="font-display text-sm font-semibold tabular-nums leading-none">{q.session_count}</p>
                    <span className="text-xs text-muted-foreground">Sesiones</span>
                  </div>
                </div>
              )}
              {q.avg_session_duration && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3">
                  <Clock className="size-4 text-primary shrink-0" strokeWidth={1.8} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">Duración est.</span>
                    <p className="font-display text-sm font-semibold leading-none">{q.avg_session_duration}</p>
                  </div>
                  {projectId && (
                    <ScheduleSessionButton
                      projectId={projectId}
                      sessionCount={q.session_count ?? 1}
                      avgSessionDuration={q.avg_session_duration}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isBot && (
          <BotIntakeSummary
            quote={q}
            clientName={clientName}
            clientPhone={q.clients?.phone ?? null}
            clientEmail={q.clients?.email ?? null}
            referencePhotosCount={referencePhotos.length}
          />
        )}

        {!isBot && q.notes && (
          <div className="rounded-2xl bg-card p-4">
            <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notas
            </h3>
            <p className="text-sm text-foreground/90">{q.notes}</p>
          </div>
        )}

        {referencePhotos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {referencePhotos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async"
                key={url}
                src={url}
                alt={`Referencia ${i + 1} del cliente`}
                className="size-20 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
