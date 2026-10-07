import Link from 'next/link'
import {
  Store,
  Wallet,
  Users,
  UsersRound,
  Bot,
  Paintbrush,
  User,
  MapPin,
  Link2,
  ChevronRight,
  HelpCircle,
} from 'lucide-react'

import type { CurrentStudio } from '@/queries/studio'
import type { FeatureKey } from '@/lib/features/catalog'
import type { SettingsMetrics } from '@/queries/settings-metrics'
import { FeatureLockedRow } from '@/components/shared/feature-locked-row'
import { LogoutButton } from '@/components/shared/logout-button'
import { VersionInfo } from '@/components/settings/version-info'
import { TutorialButton } from '@/components/settings/tutorial-button'
import { QuickActionsRow } from '@/components/settings/quick-actions-row'
import { cn } from '@/lib/utils'

/*
 * ══ Panel de control del estudio (rediseño) ═════════════════════════════
 * Cápsula de cuenta + héroe (identidad, progreso, métricas reales) +
 * cuadrícula de tarjetas compactas por módulo (cada una entra a su propia
 * página-hub o a la de siempre) + accesos rápidos + ayuda reducida.
 * Cero cambios de lógica/rutas: cada destino sigue siendo el mismo Link de
 * siempre — solo cambió cómo se agrupa y se muestra.
 */

// ── Estado real del estudio, calculado en el servidor ──────────────────────

export type StudioStatus = ReturnType<typeof computeStudioStatus>

export function computeStudioStatus(studio: CurrentStudio, blockedDaysCount: number) {
  const checks = {
    perfil: !!(studio.name && studio.city && studio.logoUrl),
    horario: !!(studio.openDays?.length && studio.openTime && studio.closeTime),
    abono: studio.depositValue !== null,
    pagos: (studio.paymentMethods?.length ?? 0) > 0,
    politicas: !!(
      studio.paymentPolicy ||
      studio.cancellationPolicy ||
      (studio.studioRules?.length ?? 0) > 0
    ),
    precios: studio.pricePresets.length > 0,
    mensajes: !!studio.quoteMessageTemplate,
    whatsapp: !!studio.whatsappPhone,
    artista: !!studio.artistName,
  }
  const total = Object.keys(checks).length
  const done = Object.values(checks).filter(Boolean).length
  return {
    checks,
    blockedDaysCount,
    pct: Math.round((done / total) * 100),
    missing: total - done,
  }
}

// ── Piezas visuales ────────────────────────────────────────────────────────

/** Anillo de progreso del héroe (SVG a mano, sin librerías). */
function ProgressRing({ pct }: { pct: number }) {
  const R = 34
  const C = 2 * Math.PI * R
  return (
    <div className="relative grid size-[4.5rem] shrink-0 place-items-center sm:size-20">
      <svg viewBox="0 0 84 84" className="absolute inset-0 -rotate-90">
        <circle cx="42" cy="42" r={R} fill="none" strokeWidth="6" className="stroke-border" />
        <circle
          cx="42"
          cy="42"
          r={R}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span className="font-title text-lg tabular-nums">
          {pct}
          <span className="text-xs text-muted-foreground">%</span>
        </span>
        <span className="mt-0.5 text-[8px] uppercase tracking-wide text-muted-foreground">Listo</span>
      </span>
    </div>
  )
}

/** Métrica compacta de la fila bajo el héroe. */
function MetricPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1 text-center">
      <span className="font-title text-lg tabular-nums leading-none sm:text-xl">{value}</span>
      <span className="text-[10px] leading-tight text-muted-foreground">{label}</span>
    </div>
  )
}

/** Tarjeta compacta de módulo: toda la tarjeta es el Link de entrada. */
function CompactCard({
  href,
  icon: Icon,
  title,
  locked,
  className,
  children,
}: {
  href: string
  icon: React.ElementType
  title: string
  locked?: boolean
  className?: string
  children: React.ReactNode
}) {
  if (locked) {
    return (
      <div className={cn('flex flex-col justify-between rounded-[1.5rem] border border-border/60 bg-card p-4', className)}>
        <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div className="mt-3">
          <h3 className="font-title text-sm uppercase leading-none text-muted-foreground">{title}</h3>
          <div className="mt-2.5">
            <FeatureLockedRow label="Disponible con suscripción" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col justify-between rounded-[1.5rem] border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:bg-accent/30 active:scale-[0.98]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <ChevronRight
          className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
      <div className="mt-3">
        <h3 className="font-title text-sm uppercase leading-none">{title}</h3>
        <div className="mt-2">{children}</div>
      </div>
    </Link>
  )
}

/** Insignia/chip de estado dentro de una CompactCard (p. ej. "Todo configurado ✓"). */
function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium',
        ok ? 'bg-primary/15 text-primary' : 'bg-amber-400/15 text-amber-400'
      )}
    >
      {label}
      {ok && <span aria-hidden="true">✓</span>}
    </span>
  )
}

// ── El panel de control ─────────────────────────────────────────────────────

export function StudioControlCenter({
  studio,
  status,
  metrics,
  pendingRequests = 0,
  teamSize = 1,
  disabledFeatures = new Set(),
}: {
  studio: CurrentStudio
  status: StudioStatus
  /** Clientes, citas, ingresos y tasa de cierre del mes — ver queries/settings-metrics.ts. */
  metrics: SettingsMetrics
  /** Solicitudes de ingreso pendientes de aprobar. */
  pendingRequests?: number
  /** Tatuadores activos del estudio (incluye al dueño). */
  teamSize?: number
  /** Módulos apagados por un admin de OFINK (ver /admin → Módulos por cuenta). */
  disabledFeatures?: Set<FeatureKey>
}) {
  const { checks } = status
  const isEstudio = studio.accountKind === 'estudio'

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* ═══ Cápsula selectora de cuenta ═══ */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {isEstudio ? 'Estudio' : 'Tatuador'}
        </span>
      </div>

      {/* ═══ Héroe: identidad + progreso + métricas ═══ */}
      <section data-tour="settings-hero" className="rounded-[2rem] border border-border/60 bg-card p-5 sm:p-7">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {studio.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={studio.logoUrl}
                alt=""
                loading="eager"
                decoding="async"
                className="size-14 shrink-0 rounded-full border border-border object-cover sm:size-16"
              />
            ) : (
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 font-title text-2xl text-primary sm:size-16">
                {studio.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-title text-xl uppercase leading-none sm:text-2xl">{studio.name}</h1>
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Pro
                </span>
              </div>
              {studio.city ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" strokeWidth={2} aria-hidden="true" />
                  {studio.city}
                </p>
              ) : null}
              <Link
                href="/dashboard/settings/enlace"
                className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
              >
                <Link2 className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                ofink.co/t/{studio.slug}
              </Link>
            </div>
          </div>
          <ProgressRing pct={status.pct} />
        </div>

        <div className="mt-5 flex items-stretch divide-x divide-border/60 border-t border-border/60 pt-4">
          <MetricPill value={String(metrics.clientsCount)} label="Clientes" />
          <MetricPill value={String(metrics.sessionsThisMonth)} label="Citas este mes" />
          <MetricPill value={`$${Math.round(metrics.incomeThisMonth / 1000)}K`} label="Ingresos del mes" />
          <MetricPill value={`${metrics.conversionPct}%`} label="Tasa de cierre" />
        </div>
      </section>

      {/* ═══ Cuadrícula de módulos ═══ */}
      <div className="grid grid-cols-2 gap-3.5">
        <CompactCard href="/dashboard/settings/estudio" icon={Store} title="Estudio">
          <StatusChip ok={status.missing === 0} label={status.missing === 0 ? 'Todo configurado' : `${status.missing} pendientes`} />
        </CompactCard>

        <CompactCard href="/dashboard/settings/clientes" icon={Users} title="Clientes">
          <StatusChip ok label={`${metrics.clientsCount} clientes`} />
        </CompactCard>

        <CompactCard
          href="/dashboard/settings/bot"
          icon={Bot}
          title="Bot de solicitudes"
          locked={disabledFeatures.has('bot')}
          className="ring-1 ring-primary/25"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusChip ok label="Activo" />
            {checks.whatsapp && <StatusChip ok label="WhatsApp" />}
          </div>
        </CompactCard>

        <CompactCard href="/dashboard/settings/cotizaciones" icon={Wallet} title="Cotizaciones">
          <StatusChip
            ok={checks.precios}
            label={checks.precios ? `${studio.pricePresets.length} precios base` : 'Sin precios'}
          />
        </CompactCard>

        <CompactCard href="/dashboard/settings/personalizacion" icon={Paintbrush} title="Personalización">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-full border border-border/60"
              style={{ backgroundColor: studio.quoteTemplateColor || 'var(--primary)' }}
            />
            <span className="text-[11px] text-muted-foreground">Tema oscuro</span>
          </div>
        </CompactCard>

        <CompactCard href="/dashboard/settings/cuenta" icon={User} title="Cuenta">
          <StatusChip ok label="Plan PRO" />
        </CompactCard>

        {isEstudio && (
          <CompactCard href="/dashboard/settings/equipo" icon={UsersRound} title="Equipo" className="col-span-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusChip ok label={`${teamSize} / 20 tatuadores`} />
              {pendingRequests > 0 && <StatusChip ok={false} label={`${pendingRequests} solicitud(es)`} />}
            </div>
          </CompactCard>
        )}
      </div>

      {/* ═══ Accesos rápidos ═══ */}
      <div>
        <p className="mb-2 px-1 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Accesos rápidos
        </p>
        <QuickActionsRow slug={studio.slug} whatsappConnected={checks.whatsapp} />
      </div>

      {/* ═══ Ayuda y soporte (reducida) ═══ */}
      <section className="rounded-[1.75rem] border border-border/60 bg-card p-2">
        <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-1">
          <HelpCircle className="size-3.5 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Ayuda y soporte
          </p>
        </div>
        <div className="mt-1">
          <TutorialButton />
        </div>
        <div className="border-t border-border/60">
          <VersionInfo />
        </div>
        <div className="mt-1 border-t border-border/60 pt-1">
          <LogoutButton />
        </div>
      </section>
    </div>
  )
}
