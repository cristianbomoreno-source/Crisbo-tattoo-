import Link from 'next/link'
import {
  CalendarX,
  CaretRight,
  ChatCircleText,
  Clock,
  CreditCard,
  Cube,
  IdentificationBadge,
  InstagramLogo,
  Palette,
  Storefront,
  Target,
  UserSwitch,
  UsersThree,
  WhatsappLogo,
} from '@phosphor-icons/react/dist/ssr'
import type { CurrentStudio } from '@/queries/studio'
import type { FeatureKey } from '@/lib/features/catalog'
import { LogoutButton } from '@/components/shared/logout-button'
import { VersionInfo } from '@/components/settings/version-info'
import { TutorialButton } from '@/components/settings/tutorial-button'
import { StudioModules } from '@/components/settings/studio-modules'
import { LargeTitle } from '@/components/shared/large-title'
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-list'
import { LinkPageCard } from '@/components/settings/link-page-card'

/** Qué tan completo está el estudio (tarjeta de perfil de Estudio). */
export function computeStudioStatus(studio: CurrentStudio, blockedDaysCount: number) {
  const checks = {
    perfil: !!(studio.name && studio.city && studio.logoUrl),
    horario: !!(studio.openDays?.length && studio.openTime && studio.closeTime),
    pagos: (studio.paymentMethods?.length ?? 0) > 0,
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

export type StudioStatus = ReturnType<typeof computeStudioStatus>

const DAY_ORDER = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']
const DAY_SHORT: Record<string, string> = { LUN: 'Lun', MAR: 'Mar', MIE: 'Mié', JUE: 'Jue', VIE: 'Vie', SAB: 'Sáb', DOM: 'Dom' }

/** "Lun – Sáb" si los días son seguidos; si no, la cantidad. */
function daysLabel(days: string[] | null) {
  const idx = (days ?? [])
    .map((d) => DAY_ORDER.indexOf(d))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)
  if (idx.length === 0) return null
  if (idx.length === 7) return 'Todos los días'
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1]! + 1)
  return consecutive ? `${DAY_SHORT[DAY_ORDER[idx[0]!]!]} – ${DAY_SHORT[DAY_ORDER[idx[idx.length - 1]!]!]}` : `${idx.length} días`
}

/**
 * Pestaña Estudio, al estilo de Ajustes del iPhone (oct 2026): tarjetas de
 * color de los módulos, la tarjeta de perfil del estudio (como la del Apple
 * ID, con el % configurado), la página de links y listas agrupadas con todo
 * lo configurable, sin páginas intermedias. Los estados son reales (WhatsApp
 * e Instagram conectados, días bloqueados, medios de pago…).
 */
export function StudioControlCenter({
  studio,
  status,
  pendingRequests = 0,
  teamSize = 1,
  disabledFeatures = new Set(),
  whatsappConnected = false,
  instagramConnected = false,
  linkPath,
}: {
  studio: CurrentStudio
  status: StudioStatus
  /** Solicitudes de ingreso pendientes de aprobar. */
  pendingRequests?: number
  /** Tatuadores activos del estudio (incluye al dueño). */
  teamSize?: number
  /** Módulos apagados por un admin de Crisbo Tattoo (ver /admin → Módulos por cuenta). */
  disabledFeatures?: Set<FeatureKey>
  whatsappConnected?: boolean
  instagramConnected?: boolean
  /** Dirección pública de la página de links (/redes en el estudio principal). */
  linkPath?: string
}) {
  const { checks } = status
  const isEstudio = studio.accountKind === 'estudio'
  const hours = studio.openTime && studio.closeTime ? `${studio.openTime.slice(0, 5)} – ${studio.closeTime.slice(0, 5)}` : null
  const methods = studio.paymentMethods?.length ?? 0

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <LargeTitle title="Estudio" avatar={{ initial: studio.name.charAt(0).toUpperCase(), photoUrl: studio.logoUrl }} />
      <span className="sr-only">{isEstudio ? 'Cuenta de estudio' : 'Cuenta de tatuador'}</span>

      <StudioModules isOwner />

      {/* Tarjeta de perfil (como la del Apple ID) */}
      <Link
        href="/dashboard/settings/perfil"
        data-tour="settings-hero"
        className="flex items-center gap-4 rounded-[1.25rem] bg-card p-4 transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        {studio.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={studio.logoUrl} alt="" className="size-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="tile-gold grid size-16 shrink-0 place-items-center rounded-full text-[1.75rem] font-bold text-white">
            {studio.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1.375rem] leading-tight font-bold tracking-tight">{studio.name}</span>
          <span className="block truncate text-[15px] text-muted-foreground">{studio.city || 'Perfil del estudio, logo y ciudad'}</span>
          <span className="mt-2 flex items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${status.pct}%` }} />
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-muted-foreground tabular-nums">
              {status.missing === 0 ? 'Completo' : `${status.pct}%`}
            </span>
          </span>
        </span>
        <CaretRight className="size-4 shrink-0 text-muted-foreground/70" weight="bold" />
      </Link>

      <LinkPageCard slug={studio.slug} path={linkPath} />

      <SettingsGroup title="Tu estudio">
        <SettingsRow
          href="/dashboard/settings/perfil"
          icon={Storefront}
          tone="tile-gold"
          label="Perfil del estudio"
          pending={!checks.perfil}
          tourTag="settings-perfil"
        />
        <SettingsRow
          href="/dashboard/settings/horario"
          icon={Clock}
          tone="tile-blue"
          label="Horario"
          value={checks.horario ? `${daysLabel(studio.openDays) ?? ''}${hours ? ` · ${hours}` : ''}` : 'Configurar'}
          pending={!checks.horario}
        />
        <SettingsRow
          href="/dashboard/settings/fechas"
          icon={CalendarX}
          tone="tile-red"
          label="Fechas especiales"
          value={status.blockedDaysCount > 0 ? `${status.blockedDaysCount} bloqueadas` : 'Ninguna'}
        />
        <SettingsRow
          href="/dashboard/settings/pagos"
          icon={CreditCard}
          tone="tile-green"
          label="Medios de pago"
          value={methods > 0 ? `${methods}` : 'Configurar'}
          pending={methods === 0}
        />
        <SettingsRow href="/dashboard/settings/metas" icon={Target} tone="tile-sunset" label="Metas del mes" />
      </SettingsGroup>

      <SettingsGroup title="Conexiones">
        <SettingsRow
          href="/dashboard/settings/whatsapp"
          icon={WhatsappLogo}
          tone="tile-green"
          label="WhatsApp Business"
          value={whatsappConnected ? 'Conectado' : 'Sin conectar'}
          pending={!whatsappConnected}
        />
        <SettingsRow
          href="/dashboard/settings/instagram"
          icon={InstagramLogo}
          tone="tile-purple"
          label="Instagram"
          value={instagramConnected ? 'Conectado' : 'Sin conectar'}
          pending={!instagramConnected}
        />
        <SettingsRow
          href="/dashboard/settings/mensajes"
          icon={ChatCircleText}
          tone="tile-teal"
          label="Plantillas de mensajes"
          pending={!checks.mensajes}
        />
      </SettingsGroup>

      <SettingsGroup title="Operación">
        <SettingsRow
          href="/dashboard/settings/inventario"
          icon={Cube}
          tone="tile-brown"
          label="Inventario de insumos"
          locked={disabledFeatures.has('inventory')}
        />
        {isEstudio && (
          <SettingsRow
            href="/dashboard/settings/equipo"
            icon={UsersThree}
            tone="tile-indigo"
            label="Equipo"
            value={pendingRequests > 0 ? `${pendingRequests} solicitud${pendingRequests === 1 ? '' : 'es'}` : `${teamSize} / 20`}
            pending={pendingRequests > 0}
          />
        )}
      </SettingsGroup>

      <SettingsGroup title="Apariencia">
        <SettingsRow href="/dashboard/settings/personalizacion" icon={Palette} tone="tile-purple" label="Tema y colores" />
      </SettingsGroup>

      <SettingsGroup title="Cuenta">
        <SettingsRow
          href="/dashboard/settings/artista"
          icon={IdentificationBadge}
          tone="tile-gray"
          label="Perfil de artista"
          pending={!checks.artista}
        />
        <SettingsRow href="/dashboard/settings/cuentas" icon={UserSwitch} tone="tile-slate" label="Cuentas Crisbo Tattoo" />
      </SettingsGroup>

      <SettingsGroup title="Ayuda">
        <TutorialButton />
        <VersionInfo />
        <LogoutButton className="min-h-[3.25rem] rounded-none px-4 text-[1.0625rem] font-normal text-destructive hover:bg-destructive/10" />
      </SettingsGroup>
    </div>
  )
}
