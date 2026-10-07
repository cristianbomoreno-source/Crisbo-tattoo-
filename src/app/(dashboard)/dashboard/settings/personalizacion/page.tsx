import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Paintbrush } from 'lucide-react'
import { getCurrentStudio } from '@/queries/studio'
import { computeStudioStatus } from '@/components/settings/studio-control-center'
import { getBlockedDays } from '@/queries/blocked-days'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { StatusRow } from '@/components/settings/status-row'
import { ThemeToggle } from '@/components/settings/theme-toggle'
import { TemplateColorPicker } from '@/components/settings/template-color-picker'
import { OctopusMenuSettings } from '@/components/settings/octopus-menu-settings'

export default async function PersonalizacionHubPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const now = new Date()
  const inAYear = new Date(now)
  inAYear.setFullYear(inAYear.getFullYear() + 1)
  const blockedResult = await getBlockedDays(now.toISOString(), inAYear.toISOString())
  const blockedDays = blockedResult.success ? blockedResult.data : []
  const status = computeStudioStatus(studio, blockedDays.length)

  return (
    <SettingsSubpage title="Personalización" description="Tu marca dentro de OFINK: logo, colores y tema.">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings/perfil"
          aria-label="Cambiar el logo del estudio"
          className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-black transition-colors hover:border-primary/50"
        >
          {studio.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={studio.logoUrl} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
          ) : (
            <span className="font-title text-xl text-white">{studio.name.charAt(0)}</span>
          )}
        </Link>
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border">
          <span className="size-6 rounded-full bg-primary" />
        </span>
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border font-title text-xl">
          Aa
        </span>
      </div>

      <div className="mt-5">
        <ThemeToggle />
      </div>
      <div className="mt-3">
        <TemplateColorPicker initialColor={studio.quoteTemplateColor} />
      </div>
      <div className="mt-3">
        <OctopusMenuSettings accountKind={studio.accountKind} />
      </div>
      <div className="mt-3 border-t border-border/60 pt-2">
        <StatusRow href="/dashboard/settings/mensajes" ok={status.checks.mensajes} label="Plantillas de WhatsApp" />
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
        <Paintbrush className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        Estos cambios se ven reflejados en tus cotizaciones PDF y en tu página pública.
      </div>
    </SettingsSubpage>
  )
}
