'use client'

import {
  FileCheck2,
  UserRound,
  Palette,
  Award,
  Store,
  CalendarClock,
  Wallet,
  ShieldCheck,
  Share2,
  ChevronRight,
  MapPin,
  Clock3,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import { cop } from '@/lib/projects/metrics'
import { ONBOARDING_STEPS, PAYMENT_POLICIES, CANCELLATION_POLICIES, EXPERIENCE_RANGES } from '@/components/onboarding/constants'
import type { OnboardingStepProps } from '@/components/onboarding/onboarding-wizard'

/** Índice de cada paso dentro de `ONBOARDING_STEPS` — se calcula, no se hardcodea,
 * para no desincronizarse si el orden de los pasos cambia. */
function stepIndexOf(key: string): number {
  return ONBOARDING_STEPS.findIndex((s) => s.key === key)
}

/** Fila del resumen (columna izquierda): icono circular outline rojo + label +
 * valor resumido + chevron. Click navega al paso correspondiente (`goToStep`,
 * expuesto por onboarding-wizard.tsx SOLO a este paso — ver comentario de
 * `StepReview` abajo). */
function ReviewRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: LucideIcon
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-card p-3.5 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/50 text-primary">
        <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="block truncate text-sm text-foreground">{value}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 font-display text-xs font-semibold uppercase tracking-wide text-primary">
        Editar
        <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </span>
    </button>
  )
}

/** Bloque de detalle (columna derecha en sm+): kicker rojo + contenido. */
function DetailBlock({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card/40 p-4">
      <p className="mb-2 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
        {kicker}
      </p>
      {children}
    </div>
  )
}

/**
 * Paso 8 — Resumen y confirmación (spec §8). Card "RESUMEN DE TU REGISTRO"
 * con filas SOLO para los datos que existen (nunca se inventa un valor) —
 * cada fila navega de vuelta a su paso. Columna de detalle (dirección, días,
 * abono grande, política de cancelación) en sm+, apilada debajo en móvil.
 *
 * `goToStep`: onboarding-wizard.tsx es dueño de `stepIndex` (estado interno,
 * no expuesto por `OnboardingStepProps` — ese tipo lo comparten los 8 pasos
 * y solo lleva `draft`/`patch`). Este paso es el ÚNICO que necesita navegar
 * directamente a un índice arbitrario, así que el wizard le pasa `goToStep`
 * como prop adicional SOLO al renderizar 'review' (no se infla el tipo común
 * que usan los demás pasos).
 *
 * El CTA "FINALIZAR REGISTRO →" y la llamada a `finishOnboarding()` /
 * `router.push('/dashboard')` ya viven en `goNext` de onboarding-wizard.tsx
 * (rama `isLast`, ver `saveStep`'s caso 'review' — defensivo, nunca se
 * ejecuta en la práctica). Este componente NO dispara el submit: solo arma
 * el resumen y deja que el footer del `StepShell` (CTA compartido) lo haga.
 */
export function StepReview({
  draft,
  goToStep,
}: OnboardingStepProps & { goToStep: (index: number) => void }) {
  const displayName = (draft.artisticName || draft.name || '').trim()
  const rulesCount = draft.rules.filter((r) => r.trim().length > 0).length

  const paymentPolicyLabel = PAYMENT_POLICIES.find((p) => p.value === draft.paymentPolicy)?.label
  const cancellationPolicyLabel = CANCELLATION_POLICIES.find((p) => p.value === draft.cancellationPolicy)?.label
  const cancellationPolicyText = CANCELLATION_POLICIES.find((p) => p.value === draft.cancellationPolicy)?.subtitle
  const experienceRangeLabel = EXPERIENCE_RANGES.find((r) => r.value === draft.experienceRange)?.label
  const experienceParts = [
    experienceRangeLabel,
    draft.ownStudio === true ? 'Independiente' : '',
  ].filter(Boolean)

  const hasDeposit = !!draft.depositMode && draft.depositValue !== undefined
  const depositAmount = hasDeposit
    ? draft.depositMode === 'fixed'
      ? `${cop(draft.depositValue!)} COP`
      : `${draft.depositValue}%`
    : ''

  const activeSocials = [
    draft.instagram.trim() && `IG ${draft.instagram.trim()}`,
    draft.tiktok.trim() && `TikTok ${draft.tiktok.trim()}`,
    draft.facebook.trim() && 'Facebook',
    draft.website.trim() && 'Web',
  ].filter((s): s is string => !!s)

  const attentionParts = [
    draft.artistCount,
    draft.openDays.length > 0 ? draft.openDays.join(' ') : '',
    draft.openTime && draft.closeTime ? `${draft.openTime}–${draft.closeTime}` : '',
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-5 sm:grid sm:grid-cols-[3fr_2fr] sm:items-start">
      {/* Card principal — filas de resumen (columna izquierda en sm+) */}
      <div className="rounded-2xl bg-card p-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <FileCheck2 className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Resumen de tu registro
            </p>
            <p className="text-xs text-muted-foreground">Revisa que todos los datos estén correctos.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {displayName && (
            <ReviewRow
              icon={UserRound}
              label="Perfil"
              value={[displayName, draft.city].filter(Boolean).join(' · ')}
              onClick={() => goToStep(stepIndexOf('profile'))}
            />
          )}

          {draft.styles.length > 0 && (
            <ReviewRow
              icon={Palette}
              label="Especialidades"
              value={`${draft.styles.length} seleccionada${draft.styles.length === 1 ? '' : 's'}`}
              onClick={() => goToStep(stepIndexOf('specialty'))}
            />
          )}

          {experienceParts.length > 0 && (
            <ReviewRow
              icon={Award}
              label="Experiencia"
              value={experienceParts.join(' · ')}
              onClick={() => goToStep(stepIndexOf('experience'))}
            />
          )}

          {draft.studioType && (
            <ReviewRow
              icon={Store}
              label="Tu estudio"
              value={draft.studioType}
              onClick={() => goToStep(stepIndexOf('studio'))}
            />
          )}

          {attentionParts.length > 0 && (
            <ReviewRow
              icon={CalendarClock}
              label="Atención"
              value={attentionParts.join(' · ')}
              onClick={() => goToStep(stepIndexOf('studio'))}
            />
          )}

          {hasDeposit && (
            <ReviewRow
              icon={Wallet}
              label="Abono para reservas"
              value={[depositAmount, paymentPolicyLabel].filter(Boolean).join(' · ')}
              onClick={() => goToStep(stepIndexOf('deposit'))}
            />
          )}

          {(paymentPolicyLabel || cancellationPolicyLabel || rulesCount > 0) && (
            <ReviewRow
              icon={ShieldCheck}
              label="Políticas y reglas"
              // La política de pago vive AQUÍ (se elige en el paso 7): si el
              // usuario saltó el abono (paso 6), la fila "Abono para reservas"
              // no se renderiza y este es el único lugar donde se ve — sin
              // esto, un dato real del paso 7 desaparecería del resumen.
              value={[paymentPolicyLabel, cancellationPolicyLabel, rulesCount > 0 ? `${rulesCount} reglas` : '']
                .filter(Boolean)
                .join(' · ')}
              onClick={() => goToStep(stepIndexOf('policies'))}
            />
          )}

          {activeSocials.length > 0 && (
            <ReviewRow
              icon={Share2}
              label="Redes y contacto"
              value={activeSocials.join(' · ')}
              onClick={() => goToStep(stepIndexOf('socials'))}
            />
          )}
        </div>
      </div>

      {/* Detalle (columna derecha en sm+, apilada debajo en móvil) */}
      <div className="flex flex-col gap-3">
        {draft.address && (
          <DetailBlock kicker="Dirección del estudio">
            <p className="flex items-start gap-2 text-sm text-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
              <span>
                {draft.address}
                {draft.city ? `, ${draft.city}` : ''}
              </span>
            </p>
          </DetailBlock>
        )}

        {draft.openDays.length > 0 && (
          <DetailBlock kicker="Días de atención">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {draft.openDays.map((day) => (
                <span
                  key={day}
                  className="rounded-md border border-border bg-secondary px-2 py-1 font-display text-[0.62rem] font-semibold uppercase tracking-wide text-foreground"
                >
                  {day}
                </span>
              ))}
            </div>
            {draft.openTime && draft.closeTime && (
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Clock3 className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
                {draft.openTime}–{draft.closeTime}
              </p>
            )}
          </DetailBlock>
        )}

        {hasDeposit && (
          <DetailBlock kicker="Abono para reservar">
            <p className="font-title text-2xl tabular-nums text-foreground">{depositAmount}</p>
          </DetailBlock>
        )}

        {cancellationPolicyText && (
          <DetailBlock kicker="Política de cancelación">
            <p className="text-sm text-foreground">{cancellationPolicyText}</p>
          </DetailBlock>
        )}
      </div>

      {/* Aviso final */}
      <div className="flex items-start gap-3 rounded-2xl bg-card/40 p-4 sm:col-span-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Al confirmar, aceptas nuestras políticas y condiciones.</p>
          <p className="font-display text-xs font-semibold uppercase tracking-wide text-foreground">
            Estás a un paso de organizar tu estudio como un profesional.
          </p>
        </div>
      </div>
    </div>
  )
}
