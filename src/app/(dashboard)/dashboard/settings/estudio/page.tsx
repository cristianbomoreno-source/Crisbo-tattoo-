import { redirect } from 'next/navigation'
import { Store } from 'lucide-react'
import { getCurrentStudio } from '@/queries/studio'
import { getBlockedDays } from '@/queries/blocked-days'
import { getDisabledFeatures } from '@/queries/features'
import { computeStudioStatus } from '@/components/settings/studio-control-center'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { StatusRow } from '@/components/settings/status-row'

export default async function EstudioHubPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const now = new Date()
  const inAYear = new Date(now)
  inAYear.setFullYear(inAYear.getFullYear() + 1)
  const [blockedResult, disabledFeatures] = await Promise.all([
    getBlockedDays(now.toISOString(), inAYear.toISOString()),
    getDisabledFeatures(studio.id),
  ])
  const blockedDays = blockedResult.success ? blockedResult.data : []
  const status = computeStudioStatus(studio, blockedDays.length)
  const { checks } = status

  return (
    <SettingsSubpage title="Estudio" description="Perfil, horario y presencia de tu estudio.">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Store className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <StatusRow
          href="/dashboard/settings/perfil"
          ok={checks.perfil}
          label={checks.perfil ? 'Perfil completo' : 'Completa tu perfil'}
          tourTag="settings-perfil"
        />
        <StatusRow
          href="/dashboard/settings/horario"
          ok={checks.horario}
          label={checks.horario ? 'Horario configurado' : 'Configura tu horario'}
        />
        <StatusRow href="/dashboard/settings/enlace" ok label="Link público activo" locked={disabledFeatures.has('public_page')} />
        <StatusRow href="/dashboard/stats" ok label="Estadísticas del estudio" />
        <StatusRow href="/dashboard/settings/finanzas" ok label="Finanzas" tourTag="settings-finanzas" locked={disabledFeatures.has('finances')} />
        <StatusRow href="/dashboard/settings/gastos" ok label="Gastos y costos" locked={disabledFeatures.has('finances')} />
        <StatusRow href="/dashboard/settings/inventario" ok label="Inventario de insumos" locked={disabledFeatures.has('inventory')} />
        <StatusRow
          href="/dashboard/settings/fechas"
          ok={status.blockedDaysCount > 0}
          label="Fechas especiales"
          value={status.blockedDaysCount > 0 ? String(status.blockedDaysCount) : 'Sin configurar'}
        />
      </div>
    </SettingsSubpage>
  )
}
