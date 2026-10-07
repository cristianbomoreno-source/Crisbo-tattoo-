'use client'

import * as React from 'react'
import { Music2, Globe, Link2, Info, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OnboardingStepProps } from '@/components/onboarding/onboarding-wizard'

/** Regla de formato del slug — MISMA que `socialsStepSchema` (Zod) en
 * `lib/validations/onboarding.ts`: solo minúsculas, números y guiones (3-40). */
const SLUG_REGEX = /^[a-z0-9-]{3,40}$/

/** Sanea en vivo lo que el usuario escribe: minúsculas, espacios → guión,
 * descarta cualquier caracter fuera de [a-z0-9-]. No fuerza el mínimo de 3
 * mientras escribe (eso lo comunica el mensaje de error debajo del input). */
function sanitizeSlugInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)
}

/**
 * Glifo de Instagram (marca). No existe `Instagram` en lucide-react 1.21
 * (verificado) — se dibuja un glifo minimal inline (cámara: cuadrado
 * redondeado + lente + punto), mismo patrón que `WaGlyph` (shared/wa-glyph.tsx).
 */
function IgGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Glifo de Facebook (marca). Tampoco existe `Facebook` en lucide-react 1.21
 * (verificado) — se dibuja la "f" minúscula clásica, mismo patrón que
 * `WaGlyph` (path SVG inline, `fill="currentColor"`).
 */
function FbGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M15.12 8.44h-2.19V7c0-.66.44-.82.75-.82h1.4V3.6L12.6 3.59c-2.7 0-3.31 2.02-3.31 3.31v1.54H7.6v2.9h1.69V21h3.64v-9.66h2.02l.27-2.9z" />
    </svg>
  )
}

/** Cuadrado de icono a la izquierda de cada fila (marca de la red o neutro para web). */
function IconSquare({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm', className)}>
      {children}
    </span>
  )
}

/** Fila de red social: cuadrado de marca + label + input + check rojo cuando
 * tiene valor no vacío (brief §5 — validación es solo "no vacío", no formato). */
function SocialRow({
  icon,
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: React.ReactNode
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: React.HTMLInputTypeAttribute
}) {
  const hasValue = value.trim().length > 0
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring">
      {icon}
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="mb-0.5 block font-display text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
        />
      </div>
      {hasValue && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
        </span>
      )}
    </div>
  )
}

/** Iconito pequeño de red social en la vista previa — solo se muestra si la red tiene valor. */
function PreviewSocialIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', className)}>
      {children}
    </span>
  )
}

/**
 * Paso 5 — Redes sociales (opcional, spec §5). Instagram / TikTok / Facebook /
 * Página web (4 filas) + nota + VISTA PREVIA (logo, nombre, iconitos de redes
 * con valor, y el enlace de reservas `t/{slug}` con slug editable en vivo).
 *
 * Nota de datos: `OnboardingPrefill` (actions/onboarding.ts) NO expone
 * `logo_url` del estudio — solo el `File` recién elegido en el paso 1 vive en
 * `draft.logoFile`, y `saveStep('profile', …)` lo limpia (`patch({ logoFile:
 * null })`) justo después de subirlo con éxito. Para cuando el usuario llega
 * al paso 5, `draft.logoFile` ya es `null` en el flujo normal — así que la
 * vista previa SIEMPRE usa el círculo con inicial (nunca inventa una imagen).
 * Si en el futuro se agrega `logoUrl` al prefill, este es el único punto a tocar.
 */
export function StepSocials({ draft, patch }: OnboardingStepProps) {
  const displayName = (draft.artisticName || draft.name || '').trim()
  const initial = displayName.charAt(0).toUpperCase() || '?'

  const activeSocials: { key: string; icon: React.ReactNode; bg: string; has: boolean }[] = [
    {
      key: 'instagram',
      icon: <IgGlyph className="size-3.5" />,
      bg: 'bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] text-white',
      has: draft.instagram.trim().length > 0,
    },
    {
      key: 'tiktok',
      icon: <Music2 className="size-3.5" strokeWidth={1.8} aria-hidden="true" />,
      bg: 'bg-black text-white',
      has: draft.tiktok.trim().length > 0,
    },
    {
      key: 'facebook',
      icon: <FbGlyph className="size-3.5" />,
      bg: 'bg-[#1877F2] text-white',
      has: draft.facebook.trim().length > 0,
    },
    {
      key: 'website',
      icon: <Globe className="size-3.5" strokeWidth={1.8} aria-hidden="true" />,
      bg: 'bg-secondary text-foreground',
      has: draft.website.trim().length > 0,
    },
  ].filter((s) => s.has)

  const slugValid = draft.slug === '' || SLUG_REGEX.test(draft.slug)

  return (
    <div className="flex flex-col gap-6">
      {/* 4 filas de redes → draft.instagram / tiktok / facebook / website */}
      <div className="flex flex-col gap-2.5">
        <SocialRow
          icon={
            <IconSquare className="bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] text-white">
              <IgGlyph className="size-5.5" />
            </IconSquare>
          }
          label="Instagram"
          id="socials-instagram"
          value={draft.instagram}
          onChange={(instagram) => patch({ instagram })}
          placeholder="@crisbo.tattoo"
        />
        <SocialRow
          icon={
            <IconSquare className="bg-black text-white">
              <Music2 className="size-5.5" strokeWidth={1.8} aria-hidden="true" />
            </IconSquare>
          }
          label="TikTok"
          id="socials-tiktok"
          value={draft.tiktok}
          onChange={(tiktok) => patch({ tiktok })}
          placeholder="@usuario"
        />
        <SocialRow
          icon={
            <IconSquare className="bg-[#1877F2] text-white">
              <FbGlyph className="size-5.5" />
            </IconSquare>
          }
          label="Facebook"
          id="socials-facebook"
          value={draft.facebook}
          onChange={(facebook) => patch({ facebook })}
          placeholder="facebook.com/tuestudio"
        />
        <SocialRow
          icon={
            <IconSquare className="bg-secondary text-foreground">
              <Globe className="size-5.5" strokeWidth={1.8} aria-hidden="true" />
            </IconSquare>
          }
          label="Página web"
          id="socials-website"
          value={draft.website}
          onChange={(website) => patch({ website })}
          placeholder="www.tuestudio.com"
        />
      </div>

      {/* Nota */}
      <div className="flex items-start gap-3 rounded-2xl bg-card/40 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          Estas redes se mostrarán en tus cotizaciones PDF, en tu perfil público y en tu enlace de reservas.
        </p>
      </div>

      {/* Explicación de "Mi Link" (página pública tipo Linktree) */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <Link2 className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-wide text-primary">
            Así funciona tu enlace de reservas
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            El <span className="font-medium text-foreground">t/{draft.slug || 'tu-estudio'}</span> de abajo es tu
            página pública tipo Linktree. Más adelante vas a poder usarla para reunir ahí TODOS tus enlaces
            personalizados — portafolio, tienda, agenda y lo que quieras — en un solo lugar para compartir.
          </p>
        </div>
      </div>

      {/* VISTA PREVIA */}
      <div className="rounded-2xl border-primary bg-card p-4">
        <span className="mb-3 block font-display text-xs font-semibold uppercase tracking-wide text-primary">
          Vista previa
        </span>

        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-display text-lg font-semibold uppercase text-foreground">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold uppercase tracking-wide text-foreground">
              {displayName || 'Tu estudio'}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              {activeSocials.length > 0 ? (
                activeSocials.map((s) => (
                  <PreviewSocialIcon key={s.key} className={s.bg}>
                    {s.icon}
                  </PreviewSocialIcon>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Aún no agregas redes</span>
              )}
            </div>
          </div>
        </div>

        {/* Enlace de reservas → draft.slug (editable, validación en vivo) */}
        <div className="mt-4">
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-ring',
              slugValid ? 'border-border' : 'border-warning'
            )}
          >
            <Link2 className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
            <span className="shrink-0 text-sm text-muted-foreground">t/</span>
            <label htmlFor="socials-slug" className="sr-only">
              Enlace de reservas
            </label>
            <input
              id="socials-slug"
              type="text"
              value={draft.slug}
              onChange={(e) => patch({ slug: sanitizeSlugInput(e.target.value) })}
              placeholder="tu-estudio"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>
          {!slugValid && (
            <p className="mt-1.5 text-xs text-warning">Solo minúsculas, números y guiones (3-40 caracteres)</p>
          )}
        </div>
      </div>
    </div>
  )
}
