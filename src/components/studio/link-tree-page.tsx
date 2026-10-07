'use client'

import { motion } from 'motion/react'
import { Music2, Globe, MessageCircle, Share2, Paintbrush, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { LinkPageConfig } from '@/lib/link-page/theme'
import { iconFor } from '@/lib/link-page/theme'
import { backgroundStyle, cardStyle, fontStyle, hexToRgba } from '@/lib/link-page/style'
import { OfinkFixedFooter } from '@/components/studio/ofink-fixed-footer'

/** Glifo de Instagram (marca). No existe `Instagram` en lucide-react 1.21. */
function IgGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Glifo de Facebook (marca). No existe `Facebook` en lucide-react 1.21. */
function FbGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M15.12 8.44h-2.19V7c0-.66.44-.82.75-.82h1.4V3.6L12.6 3.59c-2.7 0-3.31 2.02-3.31 3.31v1.54H7.6v2.9h1.69V21h3.64v-9.66h2.02l.27-2.9z" />
    </svg>
  )
}

export type LinkTreeLink = {
  id: string
  label: string
  subtitle: string | null
  url: string
  icon: string
  color: string | null
}

export function LinkTreePage({
  slug,
  studioName,
  instagram,
  tiktok,
  facebook,
  website,
  whatsapp,
  links,
  config,
  isOwner,
}: {
  slug: string
  studioName: string
  instagram: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  whatsapp: string | null
  links: LinkTreeLink[]
  config: LinkPageConfig
  isOwner: boolean
}) {
  const { theme } = config
  const name = config.displayName || studioName
  const hasSocials = instagram || tiktok || facebook || website || whatsapp

  function handleShare() {
    const url = `${window.location.origin}/l/${slug}`
    if (navigator.share) {
      navigator.share({ title: name, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  const wrapInitial = theme.animations ? { opacity: 0, y: 10 } : false

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center overflow-hidden"
      style={{ ...backgroundStyle(theme.background), ...fontStyle(theme) }}
    >
      {theme.background.type === 'video' && (
        <video
          src={theme.background.url}
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none fixed inset-0 -z-10 size-full object-cover"
        />
      )}

      {config.coverPhotoUrl && (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={config.coverPhotoUrl} alt="" className="size-full object-cover opacity-60" />
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${theme.background.type === 'color' ? theme.background.color : '#000'})` }} />
        </div>
      )}

      {isOwner && (
        <div className="relative z-20 flex w-full max-w-md items-center justify-between px-5 pt-6">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Compartir"
            className="grid size-10 place-items-center rounded-full border"
            style={{ borderColor: hexToRgba(theme.colors.border, 0.4), color: theme.colors.icon }}
          >
            <Share2 className="size-4" strokeWidth={1.8} />
          </button>
          <Link
            href="/dashboard/settings/enlace/personalizar"
            className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium"
            style={{ borderColor: hexToRgba(theme.colors.border, 0.4), color: theme.colors.text }}
          >
            <Paintbrush className="size-3.5" strokeWidth={1.8} />
            Personalizar
          </Link>
        </div>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5 pb-8 pt-8">
        {config.profilePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.profilePhotoUrl}
            alt={name}
            className="size-28 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 3px ${theme.colors.accent}` }}
          />
        ) : (
          <span
            className="grid size-28 place-items-center rounded-full font-title text-3xl"
            style={{ backgroundColor: hexToRgba(theme.colors.accent, 0.15), color: theme.colors.accent, boxShadow: `0 0 0 3px ${theme.colors.accent}` }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        {config.badgeLabel && (
          <span
            className="mt-4 rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: theme.colors.accent, color: theme.colors.accent }}
          >
            {config.badgeLabel}
          </span>
        )}

        <h1 className="mt-3 text-center font-title text-2xl uppercase leading-none" style={{ color: theme.colors.text }}>
          {name}
        </h1>
        {config.tagline && (
          <p className="mt-1 text-center text-lg" style={{ color: theme.colors.accent, fontFamily: 'Caveat, cursive' }}>
            {config.tagline}
          </p>
        )}
        {config.bio && (
          <p className="mt-2 max-w-xs text-center text-sm opacity-80" style={{ color: theme.colors.text }}>
            {config.bio}
          </p>
        )}
        {config.locationLabel && (
          <p className="mt-1.5 flex items-center gap-1 text-xs opacity-70" style={{ color: theme.colors.text }}>
            <MapPin className="size-3" strokeWidth={2} />
            {config.locationLabel}
          </p>
        )}

        {hasSocials && (
          <div className="mt-5 flex gap-3">
            {instagram && (
              <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex size-11 items-center justify-center rounded-full border" style={{ borderColor: hexToRgba(theme.colors.border, 0.4), color: theme.colors.icon }}>
                <IgGlyph className="size-5" />
              </a>
            )}
            {tiktok && (
              <a href={`https://tiktok.com/@${tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" aria-label="TikTok" className="flex size-11 items-center justify-center rounded-full border" style={{ borderColor: hexToRgba(theme.colors.border, 0.4), color: theme.colors.icon }}>
                <Music2 className="size-5" strokeWidth={1.8} />
              </a>
            )}
            {facebook && (
              <a href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex size-11 items-center justify-center rounded-full border" style={{ borderColor: hexToRgba(theme.colors.border, 0.4), color: theme.colors.icon }}>
                <FbGlyph className="size-5" />
              </a>
            )}
            {website && (
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer" aria-label="Sitio web" className="flex size-11 items-center justify-center rounded-full border" style={{ borderColor: hexToRgba(theme.colors.border, 0.4), color: theme.colors.icon }}>
                <Globe className="size-5" strokeWidth={1.8} />
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex size-11 items-center justify-center rounded-full border" style={{ borderColor: hexToRgba(theme.colors.border, 0.4), color: theme.colors.icon }}>
                <MessageCircle className="size-5" strokeWidth={1.8} />
              </a>
            )}
          </div>
        )}

        <div className="mt-8 flex w-full flex-col gap-3">
          {links.map((link, i) => {
            const Icon = iconFor(link.icon)
            const accent = link.color || theme.colors.accent
            const content = (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: hexToRgba(accent, 0.15), color: accent }}>
                  <Icon className="size-[18px]" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold">{link.label}</span>
                  {link.subtitle && <span className="block truncate text-xs opacity-70">{link.subtitle}</span>}
                </span>
                <ChevronRight className="size-4 shrink-0 opacity-50" strokeWidth={2} />
              </>
            )
            return (
              <motion.div
                key={link.id}
                initial={wrapInitial}
                animate={theme.animations ? { opacity: 1, y: 0 } : undefined}
                transition={theme.animations ? { delay: i * 0.05, duration: 0.35 } : undefined}
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5 transition-transform active:scale-[0.98]"
                  style={cardStyle(theme)}
                >
                  {content}
                </a>
              </motion.div>
            )
          })}
          {links.length === 0 && !hasSocials && (
            <p className="text-center text-xs opacity-60" style={{ color: theme.colors.text }}>
              Aún no hay enlaces disponibles.
            </p>
          )}
        </div>
      </div>

      <OfinkFixedFooter />
    </div>
  )
}
