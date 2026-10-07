import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { computeStudioStatus } from '@/components/settings/studio-control-center'
import { getBlockedDays } from '@/queries/blocked-days'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { StatusRow } from '@/components/settings/status-row'

export default async function CuentaHubPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const now = new Date()
  const inAYear = new Date(now)
  inAYear.setFullYear(inAYear.getFullYear() + 1)
  const blockedResult = await getBlockedDays(now.toISOString(), inAYear.toISOString())
  const blockedDays = blockedResult.success ? blockedResult.data : []
  const status = computeStudioStatus(studio, blockedDays.length)

  return (
    <SettingsSubpage title="Cuenta" description="Tu perfil de artista, suscripción y sesión.">
      <div className="flex flex-col gap-0.5">
        <StatusRow
          href="/dashboard/settings/artista"
          ok={status.checks.artista}
          label={status.checks.artista ? 'Perfil de artista' : 'Completa tu perfil de artista'}
        />
        <div className="flex min-h-9 items-center gap-2.5 px-1.5 py-1 text-[13px] text-foreground/90">
          Suscripción
          <span className="rounded-full bg-primary px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
            Pro
          </span>
        </div>
        <div className="mt-1 border-t border-border/60 pt-1">
          <StatusRow href="/dashboard/settings/cuentas" ok label="Cuentas OFINK" />
        </div>
      </div>
    </SettingsSubpage>
  )
}
