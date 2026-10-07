import { redirect } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { getCurrentStudio } from '@/queries/studio'
import { getBlockedDays } from '@/queries/blocked-days'
import { computeStudioStatus } from '@/components/settings/studio-control-center'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { StatusRow } from '@/components/settings/status-row'

export default async function CotizacionesHubPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/settings')

  const now = new Date()
  const inAYear = new Date(now)
  inAYear.setFullYear(inAYear.getFullYear() + 1)
  const blockedResult = await getBlockedDays(now.toISOString(), inAYear.toISOString())
  const blockedDays = blockedResult.success ? blockedResult.data : []
  const status = computeStudioStatus(studio, blockedDays.length)
  const { checks } = status

  return (
    <SettingsSubpage title="Cotizaciones" description="Precios, abonos, pagos y políticas.">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Wallet className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <StatusRow
          href="/dashboard/settings/abono"
          ok={checks.abono}
          label="Abono para reservar"
          value={
            checks.abono
              ? studio.depositMode === 'percent'
                ? `${studio.depositValue}%`
                : `$${studio.depositValue?.toLocaleString('es-CO')}`
              : undefined
          }
        />
        <StatusRow
          href="/dashboard/settings/pagos"
          ok={checks.pagos}
          label="Métodos de pago"
          value={checks.pagos ? String(studio.paymentMethods?.length) : undefined}
        />
        <StatusRow
          href="/dashboard/settings/precios"
          ok={checks.precios}
          label="Precios preestablecidos"
          value={checks.precios ? String(studio.pricePresets.length) : undefined}
          tourTag="settings-precios"
        />
        <StatusRow
          href="/dashboard/settings/politicas"
          ok={checks.politicas}
          label={checks.politicas ? 'Políticas del estudio' : 'Define tus políticas'}
        />
        <StatusRow href="/dashboard/settings/carta" ok label="Carta y negociación" />
        <StatusRow
          href="/dashboard/settings/metas"
          ok
          label="Metas mensuales"
          value={
            [studio.monthlyGoalQuotedValue, studio.monthlyGoalApprovedProjects, studio.monthlyGoalScheduledSessions].filter(
              (v) => v !== null
            ).length > 0
              ? 'Definidas'
              : 'Sin definir'
          }
        />
      </div>
    </SettingsSubpage>
  )
}
