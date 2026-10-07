import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { getCurrentStudio } from '@/queries/studio'
import { getBlockedDays } from '@/queries/blocked-days'
import { getDisabledFeatures } from '@/queries/features'
import { computeStudioStatus } from '@/components/settings/studio-control-center'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { StatusRow } from '@/components/settings/status-row'

export default async function ClientesHubPage() {
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
    <SettingsSubpage title="Clientes" description="Tu base de clientes, consentimientos y mensajes.">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Users className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <StatusRow href="/dashboard/clients" ok label="Base de clientes" />
        <StatusRow href="/dashboard/gallery" ok label="Galería" locked={disabledFeatures.has('gallery')} />
        <StatusRow href="/dashboard/consents" ok label="Consentimientos" locked={disabledFeatures.has('consents')} />
        <StatusRow
          href="/dashboard/settings/mensajes"
          ok={checks.mensajes}
          label={checks.mensajes ? 'Mensajes configurados' : 'Configura tus mensajes'}
        />
      </div>
    </SettingsSubpage>
  )
}
