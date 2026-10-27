import Link from 'next/link'
import { CaretRight, FacebookLogo, Globe, InstagramLogo, MapPin, PencilSimple, TiktokLogo, WhatsappLogo } from '@phosphor-icons/react/dist/ssr'
import { Icon3D, type Icon3DName } from '@/components/ui/icon-3d'
import { cn } from '@/lib/utils'
import type { PublicLinkPage } from '@/lib/link-page/load'

/** Ícono 3D y color de tarjeta por tipo de botón (lib/link-page/theme.ts LINK_ICON_OPTIONS). */
const LINK_STYLE: Record<string, { icon: Icon3DName; tone: string }> = {
  whatsapp: { icon: 'speech-balloon', tone: 'tile-green' },
  portfolio: { icon: 'framed-picture', tone: 'tile-purple' },
  quote: { icon: 'clipboard', tone: 'tile-sunset' },
  shop: { icon: 'shopping-bags', tone: 'tile-gold' },
  location: { icon: 'round-pushpin', tone: 'tile-blue' },
  website: { icon: 'globe', tone: 'tile-teal' },
  calendar: { icon: 'spiral-calendar', tone: 'tile-indigo' },
  phone: { icon: 'mobile-phone', tone: 'tile-slate' },
  star: { icon: 'star', tone: 'tile-gold' },
  heart: { icon: 'red-heart', tone: 'tile-red' },
  link: { icon: 'link', tone: 'tile-gray' },
}

const YEAR = new Date().getFullYear()

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`
const handle = (v: string) => v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?[^/]+\//, '').replace(/\/$/, '')

/**
 * Página de links (tipo Linktree) al estilo Apple Games: fondo negro con
 * resplandor dorado, foto redonda grande, nombre en título grande, redes en
 * botones de vidrio y cada enlace como tarjeta de color con ícono 3D.
 * Se ve en crisbotattoo.com/redes (estudio principal) y en /l/{slug}.
 */
export function AppleLinkPage({ page }: { page: PublicLinkPage }) {
  const name = page.displayName || page.name
  const photo = page.profilePhotoUrl || page.logoUrl
  const socials = [
    page.instagram && { href: `https://instagram.com/${handle(page.instagram)}`, label: 'Instagram', Icon: InstagramLogo },
    page.tiktok && { href: `https://tiktok.com/@${handle(page.tiktok)}`, label: 'TikTok', Icon: TiktokLogo },
    page.whatsapp && { href: waLink(page.whatsapp), label: 'WhatsApp', Icon: WhatsappLogo },
    page.facebook && { href: page.facebook.startsWith('http') ? page.facebook : `https://facebook.com/${handle(page.facebook)}`, label: 'Facebook', Icon: FacebookLogo },
    page.website && { href: page.website.startsWith('http') ? page.website : `https://${page.website}`, label: 'Sitio web', Icon: Globe },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Globe }[]

  // Tarjetas grandes automáticas con los datos del estudio (como las
  // categorías de Buscar en Apple Games), antes de los botones propios.
  const featured = [
    page.instagram && {
      href: `https://instagram.com/${handle(page.instagram)}`,
      title: 'Mis tatuajes',
      sub: `@${handle(page.instagram)}`,
      tone: 'tile-purple',
      icon: 'framed-picture' as Icon3DName,
    },
    page.location && {
      href: page.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(page.location)}`,
      title: 'Cómo llegar',
      sub: page.location,
      tone: 'tile-blue',
      icon: 'round-pushpin' as Icon3DName,
    },
    page.tiktok && {
      href: `https://tiktok.com/@${handle(page.tiktok)}`,
      title: 'TikTok',
      sub: `@${handle(page.tiktok)}`,
      tone: 'tile-slate',
      icon: 'camera' as Icon3DName,
    },
    page.website && {
      href: page.website.startsWith('http') ? page.website : `https://${page.website}`,
      title: 'Sitio web',
      sub: page.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, ''),
      tone: 'tile-teal',
      icon: 'globe' as Icon3DName,
    },
  ].filter(Boolean) as { href: string; title: string; sub: string; tone: string; icon: Icon3DName }[]

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      {/* Fondo: portada difuminada (si hay) + resplandor dorado y rayos. */}
      {page.coverPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.coverPhotoUrl} alt="" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] w-full scale-110 object-cover opacity-45 blur-2xl" />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(90%_70%_at_50%_0%,rgb(217_165_74/0.45)_0%,rgb(110_60_20/0.25)_40%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[repeating-conic-gradient(from_0deg_at_50%_14rem,rgb(255_214_150/0.08)_0deg_2deg,transparent_2deg_13deg)] [mask-image:radial-gradient(60%_55%_at_50%_14rem,black,transparent)]"
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center px-5 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {/* Perfil */}
        <div className="animate-in fade-in zoom-in-95 duration-500 ease-out">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={name}
              className="size-28 rounded-full object-cover shadow-[0_20px_50px_-12px_rgb(217_165_74/0.55)] ring-4 ring-white/10"
            />
          ) : (
            <span className="tile-gold grid size-28 place-items-center rounded-full text-[2.75rem] font-bold shadow-[0_20px_50px_-12px_rgb(217_165_74/0.55)] ring-4 ring-white/10">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {page.badge && (
          <span className="mt-5 rounded-full bg-[#f3c98a]/15 px-3 py-1 text-[12px] font-bold tracking-[0.08em] text-[#f3c98a] uppercase">{page.badge}</span>
        )}
        <h1 className={cn('text-center font-title text-[2.25rem] leading-tight font-bold tracking-tight', page.badge ? 'mt-2' : 'mt-5')}>{name}</h1>
        {page.tagline && <p className="mt-1 text-center text-[1.0625rem] font-semibold text-[#f3c98a]">{page.tagline}</p>}
        {page.bio && <p className="mt-2 max-w-sm text-center text-[1.0625rem] leading-snug text-white/70">{page.bio}</p>}
        {page.location && (
          <a
            href={page.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(page.location)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[15px] font-semibold backdrop-blur-md active:scale-95"
          >
            <MapPin className="size-4" weight="fill" />
            {page.location}
          </a>
        )}

        {/* Redes */}
        {socials.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="glass grid size-14 place-items-center rounded-full text-white transition-transform duration-150 ease-out active:scale-90"
              >
                <Icon className="size-6" weight="fill" />
              </a>
            ))}
          </div>
        )}

        {/* Botón principal */}
        {page.whatsapp && (
          <a
            href={waLink(page.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-[1.0625rem] font-bold text-primary-foreground shadow-[0_14px_36px_-12px_rgb(217_165_74/0.7)] transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <WhatsappLogo className="size-5" weight="fill" />
            Escríbeme por WhatsApp
          </a>
        )}

        {featured.length > 0 && (
          <div className="mt-4 grid w-full grid-cols-2 gap-3">
            {featured.map((f, i) => (
              <a
                key={f.title}
                href={f.href}
                target="_blank"
                rel="noreferrer"
                style={{ animationDelay: `${80 + i * 60}ms` }}
                className={cn(
                  'relative flex min-h-32 flex-col overflow-hidden rounded-[1.75rem] p-4 transition-transform duration-150 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-both active:scale-[0.97]',
                  f.tone,
                  featured.length % 2 === 1 && i === featured.length - 1 && 'col-span-2',
                )}
              >
                <Icon3D name={f.icon} className="absolute top-3 right-3 size-14" />
                <span className="mt-auto block min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-white/75">{f.sub}</span>
                  <span className="block text-[1.375rem] leading-tight font-bold tracking-tight">{f.title}</span>
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Enlaces */}
        <div className="mt-4 w-full space-y-3">
          {page.links.map((l, i) => {
            const style = LINK_STYLE[l.icon] ?? LINK_STYLE.link!
            return (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                style={{ animationDelay: `${120 + i * 60}ms` }}
                className={cn(
                  'flex min-h-[5.5rem] w-full items-center gap-4 rounded-[1.75rem] px-4 py-3 text-left transition-transform duration-150 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-both active:scale-[0.97]',
                  style.tone,
                )}
              >
                <Icon3D name={style.icon} className="size-14" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[1.1875rem] leading-tight font-bold tracking-tight">{l.label}</span>
                  {l.subtitle && <span className="block truncate text-[15px] text-white/75">{l.subtitle}</span>}
                </span>
                <CaretRight className="size-5 shrink-0 text-white/80" weight="bold" />
              </a>
            )
          })}
        </div>

        <p className="mt-10 text-[13px] text-white/40">© {YEAR} {page.name}</p>
      </div>

      {page.isOwner && (
        <Link
          href="/dashboard/settings/enlace/personalizar"
          className="glass fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-semibold"
        >
          <PencilSimple className="size-4" weight="bold" />
          Editar
        </Link>
      )}
    </main>
  )
}
