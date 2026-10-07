'use client'

import { useState } from 'react'
import {
  MessageCircle, AlertCircle, Check, Eye, Clock, AtSign,
  User, Ruler, MapPin, Palette, Droplet, Contact, CalendarDays, Images, Lightbulb, Pencil,
} from 'lucide-react'
import { submitIntakeAction } from '@/actions/intake'
import { instagramUrl } from '@/lib/intake/instagram'
import { buildBodyZone, type Answers, type StepId } from './flow'
import { COPY } from './copy'

type Props = {
  slug: string
  studioName: string
  answers: Answers
  instagram?: string | null
  onSent: () => void
  /** Tocar una fila reabre ese paso en edición (mismo mecanismo que la
   * flecha "Volver" — reutiliza startEdit/applyEdit sin cambios de lógica). */
  onEditStep?: (stepId: StepId) => void
}

export function IntakeSummary({ slug, studioName, answers, instagram, onSent, onEditStep }: Props) {
  const [accepted, setAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentLink, setSentLink] = useState<string | null>(null)

  const rows: Array<{ label: string; value: string | undefined; icon: typeof User; stepId: StepId }> = [
    { label: 'Tu nombre', value: answers.name, icon: User, stepId: 'name' },
    { label: 'Género', value: answers.gender, icon: User, stepId: 'gender' },
    { label: 'Edad', value: answers.age ? `${answers.age} años` : undefined, icon: CalendarDays, stepId: 'age' },
    { label: 'Tamaño', value: answers.size, icon: Ruler, stepId: 'size' },
    { label: 'Ubicación', value: buildBodyZone(answers), icon: MapPin, stepId: 'zone' },
    { label: 'Color', value: answers.color, icon: Palette, stepId: 'color' },
    { label: 'Tono de piel', value: answers.skinTone, icon: Droplet, stepId: 'skin' },
    { label: 'Estilo', value: answers.style, icon: Pencil, stepId: 'style' },
    { label: 'Idea', value: answers.description, icon: Lightbulb, stepId: 'description' },
    { label: 'Teléfono', value: answers.phone, icon: Contact, stepId: 'phone' },
    { label: 'Email', value: answers.email, icon: AtSign, stepId: 'contact' },
    { label: 'Disponibilidad', value: answers.availability, icon: CalendarDays, stepId: 'availability' },
  ]

  async function send() {
    setSending(true)
    setError(null)
    const fd = new FormData()
    fd.set('slug', slug)
    fd.set('name', answers.name ?? '')
    fd.set('gender', answers.gender ?? '')
    fd.set('age', answers.age ? String(answers.age) : '')
    fd.set('birthdate', answers.birthdate ?? '')
    fd.set('service', answers.service ?? '')
    fd.set('style', answers.style ?? '')
    fd.set('size', answers.size ?? '')
    fd.set('body_zone', buildBodyZone(answers))
    fd.set('color', answers.color ?? '')
    fd.set('skin_tone', answers.skinTone ?? '')
    fd.set('description', answers.description ?? '')
    fd.set('email', answers.email ?? '')
    fd.set('phone', answers.phone ?? '')
    fd.set('availability', answers.availability ?? '')
    fd.set('website', '') // honeypot
    for (const photo of answers.photos ?? []) fd.append('photos', photo)

    const result = await submitIntakeAction(fd)
    setSending(false)
    if (!result.success) {
      setError(result.error.message || COPY.errorSubmit)
      return
    }
    setSentLink(result.data.waLink)
    onSent()
  }

  if (sentLink) {
    const igUrl = instagramUrl(instagram)
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={COPY.sentTitle}
        className="fixed inset-0 z-[100] overflow-y-auto bg-background px-6 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-5 text-center">
          {/* Check con destellos */}
          <div className="relative grid place-items-center">
            <svg
              viewBox="0 0 100 100"
              className="absolute size-32 text-primary"
              fill="none"
              aria-hidden="true"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const a = ((i * 30) * Math.PI) / 180
                return (
                  <line
                    key={i}
                    x1={50 + 34 * Math.cos(a)}
                    y1={50 + 34 * Math.sin(a)}
                    x2={50 + 46 * Math.cos(a)}
                    y2={50 + 46 * Math.sin(a)}
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
            <div className="relative grid size-20 place-items-center rounded-full bg-primary">
              <Check className="size-10 text-primary-foreground" strokeWidth={3} aria-hidden />
            </div>
          </div>

          <div>
            <h2 className="font-title text-3xl uppercase tracking-tight">{COPY.sentTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{COPY.sentBody}</p>
          </div>

          {/* Próximos pasos */}
          <ul className="w-full space-y-3 rounded-2xl bg-card p-4 text-left text-sm">
            <li className="flex items-center gap-2.5">
              <Eye className="size-4 shrink-0 text-primary" aria-hidden /> {COPY.sentStep1}
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-primary" aria-hidden /> {COPY.sentStep2}
            </li>
            <li className="flex items-center gap-2.5">
              <MessageCircle className="size-4 shrink-0 text-primary" aria-hidden /> {COPY.sentStep3}
            </li>
          </ul>

          {/* Confirmación con lo que escribieron — no hay email ni WhatsApp
              Business API para "empujar" un mensaje aparte, así que el
              resumen queda visible acá mismo (puede hacer captura). */}
          <details className="w-full rounded-2xl bg-card p-4 text-left [&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer list-none text-sm font-medium text-white/90">
              Ver lo que enviaste
            </summary>
            <div className="mt-3 flex flex-col gap-2 border-t border-white/8 pt-3">
              {rows
                .filter(r => r.value)
                .map(r => (
                  <div key={r.label} className="flex items-start justify-between gap-3 text-xs">
                    <span className="shrink-0 text-muted-foreground">{r.label}</span>
                    <span className="text-right text-white/80">{r.value}</span>
                  </div>
                ))}
            </div>
          </details>

          {/* Abrir WhatsApp */}
          <button
            type="button"
            onClick={() => window.open(sentLink, '_blank', 'noopener')}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-heading text-sm uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <MessageCircle className="size-4" aria-hidden /> {COPY.openWhatsapp}
          </button>

          {/* Instagram */}
          {igUrl && (
            <div className="w-full rounded-2xl bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Mientras tanto, puedes ver más de nuestro trabajo en Instagram.
              </p>
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-heading text-sm uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <AtSign className="size-4" aria-hidden /> {COPY.openInstagram}
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col">
      {/* Overlay de envío: "Estamos preparando tu proyecto…" mientras submitIntakeAction corre. */}
      {sending && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-background px-8 text-center animate-fade-in">
          <div className="relative grid size-16 place-items-center">
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden />
            <span className="size-2 rounded-full bg-primary" style={{ boxShadow: '0 0 16px 2px var(--primary-glow, rgba(184,244,0,0.6))' }} aria-hidden />
          </div>
          <div>
            <p className="font-title text-2xl text-white">Estamos preparando tu proyecto…</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Analizando cada detalle para crear la mejor propuesta posible.
            </p>
          </div>
          <ul className="w-full max-w-[220px] space-y-2.5 text-left text-xs text-white/50">
            {['Analizando referencias', 'Estimando sesiones', 'Calculando tamaño', 'Preparando propuesta'].map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-2.5 opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 350}ms`, animationFillMode: 'forwards' }}
              >
                <Check className="size-3.5 shrink-0 text-primary" aria-hidden /> {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="shrink-0">
        <h2 className="font-title text-[28px] leading-[1.08] text-white">Casi terminamos.</h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
          Revisa tu proyecto antes de enviarlo y comenzar a crear tu cotización.
        </p>
      </div>

      <div className="mt-4 flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto pb-1">
        <div className="flex flex-col gap-1.5">
          {rows.map(({ label, value, icon: Icon, stepId }) => (
            <button
              key={label}
              type="button"
              onClick={() => onEditStep?.(stepId)}
              disabled={!onEditStep}
              className="group flex items-center gap-3 rounded-2xl bg-card px-3.5 py-2.5 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10">
                <Icon className="size-4 text-primary" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                <span className="block truncate text-sm text-white">{value || '—'}</span>
              </span>
              {onEditStep && (
                <Pencil className="size-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              )}
            </button>
          ))}
          {(answers.photos?.length ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-card px-3.5 py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10">
                <Images className="size-4 text-primary" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Referencias</span>
                <span className="mt-1 flex gap-1.5">
                  {answers.photos!.map((f, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" decoding="async"
                      key={i}
                      src={URL.createObjectURL(f)}
                      alt={`Referencia ${i + 1}`}
                      className="size-9 rounded-md border border-white/10 object-cover"
                    />
                  ))}
                </span>
              </span>
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={accepted}
            onChange={e => setAccepted(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--color-primary)]"
          />
          <span>
            {COPY.terms(studioName)}{' '}
            <button
              type="button"
              onClick={() => setShowTerms(v => !v)}
              className="cursor-pointer underline underline-offset-2"
            >
              Ver más
            </button>
          </span>
        </label>
        {showTerms && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {COPY.termsBody(studioName)}
          </p>
        )}

        {error && (
          <p className="flex items-center gap-2 text-sm text-[var(--color-ring)]">
            <AlertCircle className="size-4 shrink-0" aria-hidden /> {error}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={!accepted || sending}
        onClick={send}
        className="mt-3 inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-heading text-sm uppercase tracking-wide text-primary-foreground transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <MessageCircle className="size-4" aria-hidden />
        {sending ? COPY.sending : error ? COPY.retry : COPY.send}
      </button>
    </div>
  )
}
