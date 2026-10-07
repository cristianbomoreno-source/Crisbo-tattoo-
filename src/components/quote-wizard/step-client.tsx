'use client'

import * as React from 'react'
import { UserRound, UserRoundPlus, Search, ShieldCheck, Lock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client } from '@/queries/clients'
import type { WizardDraft } from '@/components/quote-wizard/quote-wizard'

type StepClientProps = {
  draft: WizardDraft
  patch: (patch: Partial<WizardDraft>) => void
  clients: Client[]
}

/** Búsqueda insensible a acentos (mismo patrón que `projects-board.tsx`). */
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * Glifo de WhatsApp (marca). Copiado desde `today-appointments.tsx` (allí es
 * privado al módulo) — mismo path, mismo uso: círculo verde de marca con
 * glifo blanco.
 */
function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/** Encabezado de sección: icono en círculo outline rojo + título + subtítulo. */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary text-primary">
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 pt-1">
        <h2 className="font-display text-base font-semibold uppercase tracking-wide">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

/** Card seleccionable de modo de cliente (existente / nuevo). */
function ModeCard({
  active,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-card px-3 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}
    >
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-full border',
          active ? 'border-primary text-primary' : 'border-border text-muted-foreground'
        )}
      >
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <span className="font-display text-[clamp(0.68rem,3vw,0.78rem)] font-semibold uppercase tracking-wide">
        {title}
      </span>
      <span className="text-[clamp(0.65rem,2.8vw,0.72rem)] text-muted-foreground">{subtitle}</span>
    </button>
  )
}

/**
 * Paso 1 — Cliente: elegir cliente existente (buscador) o capturar datos de
 * uno nuevo (se crea recién al guardar la cotización, paso 5). Ver spec
 * §"1 · Cliente".
 */
export function StepClient({ draft, patch, clients }: StepClientProps) {
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = norm(query.trim())
    if (!q) return clients
    return clients.filter((c) => norm(c.name).includes(q))
  }, [clients, query])

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        icon={UserRound}
        title="Cliente"
        subtitle="Selecciona o crea el cliente para esta cotización"
      />

      <div className="grid grid-cols-2 gap-3">
        <ModeCard
          active={draft.clientMode === 'existing'}
          icon={UserRound}
          title="Cliente existente"
          subtitle="Buscar en tu lista"
          onClick={() => patch({ clientMode: 'existing' })}
        />
        <ModeCard
          active={draft.clientMode === 'new'}
          icon={UserRoundPlus}
          title="Nuevo cliente"
          subtitle="Agregar información"
          onClick={() => patch({ clientMode: 'new' })}
        />
      </div>

      {draft.clientMode === 'existing' ? (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.8}
            />
            <Label htmlFor="wizard-client-search" className="sr-only">
              Buscar cliente
            </Label>
            <Input
              id="wizard-client-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente por nombre"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                No encontramos clientes con ese nombre.
              </p>
            ) : (
              filtered.map((c) => {
                const isSelected = c.id === draft.clientId
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => patch({ clientId: c.id })}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      {c.phone && (
                        <span className="block truncate text-xs text-muted-foreground">{c.phone}</span>
                      )}
                    </span>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <Label
              htmlFor="wizard-client-name"
              className="mb-1.5 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Nombre completo
            </Label>
            <div className="relative">
              <Input
                id="wizard-client-name"
                value={draft.newClientName}
                onChange={(e) => patch({ newClientName: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="h-11 pr-9"
              />
              <UserRound
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.8}
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="wizard-client-phone"
              className="mb-1.5 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              WhatsApp (opcional)
            </Label>
            <div className="relative">
              <Input
                id="wizard-client-phone"
                type="tel"
                inputMode="tel"
                value={draft.newClientPhone}
                onChange={(e) => patch({ newClientPhone: e.target.value })}
                placeholder="Ej: +57 300 123 4567"
                className="h-11 pr-9"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#25D366] text-white"
              >
                <WaGlyph />
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-border p-3.5">
        <ShieldCheck className="size-5 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">La información de tu cliente está segura</p>
          <p className="text-xs text-muted-foreground">Solo tú y tu equipo pueden verla.</p>
        </div>
        <Lock className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
      </div>
    </div>
  )
}
