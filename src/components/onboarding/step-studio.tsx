'use client'

import * as React from 'react'
import {
  Store,
  MapPin,
  CalendarDays,
  AlarmClock,
  Sun,
  Moon,
  Search,
  Check,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STUDIO_TYPES, WEEK_DAYS, TIME_OPTIONS } from '@/components/onboarding/constants'
import type { OnboardingStepProps } from '@/components/onboarding/onboarding-wizard'

const inputClass =
  'w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const selectClass =
  'w-full cursor-pointer appearance-none rounded-xl border border-border bg-card/60 px-4 py-3 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Mini-encabezado de sub-sección (mismo patrón duplicado que step-experience.tsx). */
function MiniHeader({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Icon className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide">{label}</h3>
    </div>
  )
}

/** Etiqueta de campo (mismo patrón que step-profile.tsx, duplicado localmente
 * porque no está exportado desde allá). */
function FieldLabel({
  icon,
  htmlFor,
  children,
}: {
  icon: React.ReactNode
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-2 font-display text-xs font-medium uppercase tracking-wide text-foreground"
    >
      {icon}
      {children}
    </label>
  )
}

/** `<select>` nativo estilizado con flecha custom superpuesta. */
function SelectField({
  id,
  value,
  onChange,
  children,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </div>
  )
}

/**
 * Paso 4 — Estudio (OBLIGATORIO). Tipo de estudio + dirección (con enlace de
 * Google Maps) + días de atención + horario. Sin "¿cuántos artistas
 * trabajan?" (se sacó a pedido) — todo pensado para caber sin scroll.
 * `canContinue` (onboarding-wizard.tsx) exige `studioType` + `openDays.length>0`.
 */
export function StepStudio({ draft, patch }: OnboardingStepProps) {
  function toggleDay(day: string) {
    const active = draft.openDays.includes(day)
    patch({ openDays: active ? draft.openDays.filter((d) => d !== day) : [...draft.openDays, day] })
  }

  function openMapsSearch() {
    const query = [draft.address, draft.city].filter(Boolean).join(', ')
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'estudio de tatuajes')}`,
      '_blank'
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tipo de estudio → draft.studioType */}
      <section>
        <MiniHeader icon={Store} label="Tipo de estudio" />
        <div className="grid grid-cols-3 gap-2">
          {STUDIO_TYPES.map((type) => {
            const active = draft.studioType === type.value
            const Icon = type.icon
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => patch({ studioType: type.value })}
                aria-pressed={active}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-card px-1.5 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
                <Icon
                  className={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'line-clamp-2 font-display text-[clamp(0.55rem,2.2vw,0.62rem)] font-medium uppercase leading-tight tracking-wide',
                    active ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {type.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Dirección → draft.address + draft.mapsUrl */}
      <div>
        <FieldLabel
          icon={<MapPin className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />}
          htmlFor="studio-address"
        >
          Dirección de tu estudio
        </FieldLabel>
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="studio-address"
            type="text"
            value={draft.address}
            onChange={(e) => patch({ address: e.target.value })}
            placeholder="Ej. Calle 123 #45-67, Bogotá"
            className={cn(inputClass, 'pl-10')}
          />
        </div>

        <div className="mt-2 flex gap-2">
          <input
            id="studio-maps-url"
            type="text"
            value={draft.mapsUrl}
            onChange={(e) => patch({ mapsUrl: e.target.value })}
            placeholder="Pega aquí el enlace de Google Maps"
            className={cn(inputClass, 'flex-1')}
          />
          <button
            type="button"
            onClick={openMapsSearch}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary/40"
          >
            <Search className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
            Buscar
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Toca «Buscar», ubica tu estudio en Maps, copia el enlace (botón Compartir) y pégalo aquí.
        </p>
      </div>

      {/* Días de atención → draft.openDays (multi, 7 chips full-width) */}
      <div>
        <div
          id="studio-open-days-label"
          className="mb-1.5 flex items-center gap-2 font-display text-xs font-medium uppercase tracking-wide text-foreground"
        >
          <CalendarDays className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
          Días de atención
        </div>
        <div className="flex gap-1.5" role="group" aria-labelledby="studio-open-days-label">
          {WEEK_DAYS.map((day) => {
            const active = draft.openDays.includes(day.value)
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                aria-pressed={active}
                className={cn(
                  'flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg border font-display text-[0.65rem] font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card/60 text-muted-foreground hover:border-primary/40'
                )}
              >
                {day.label}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Los días que no elijas se bloquean solos en tu calendario — puedes cambiarlo después.
        </p>
      </div>

      {/* Horario de atención → draft.openTime / draft.closeTime */}
      <section>
        <MiniHeader icon={AlarmClock} label="Horario de atención" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel
              icon={<Sun className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />}
              htmlFor="studio-open-time"
            >
              Apertura
            </FieldLabel>
            <SelectField id="studio-open-time" value={draft.openTime} onChange={(value) => patch({ openTime: value })}>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectField>
          </div>
          <div>
            <FieldLabel
              icon={<Moon className="size-3.5 text-primary" strokeWidth={2} aria-hidden="true" />}
              htmlFor="studio-close-time"
            >
              Cierre
            </FieldLabel>
            <SelectField id="studio-close-time" value={draft.closeTime} onChange={(value) => patch({ closeTime: value })}>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </section>
    </div>
  )
}
