import { PageHeader } from '@/components/shared/page-header'
import { listMyAccounts } from '@/actions/accounts'
import { getCurrentStudio } from '@/queries/studio'
import { AccountsManager } from '@/components/settings/accounts-manager'
import { FeedbackBanner } from '@/components/feedback/feedback-banner'
import { DeleteAccountSection } from '@/components/settings/delete-account-section'

/**
 * Ajustes → Cuentas OFINK: lista las cuentas del usuario (hasta 2, una
 * 'tatuador' y otra 'estudio' — mismo login de Google), permite cambiar
 * cuál está activa, y ofrece crear la que falte si aún no llega al tope.
 */
export default async function AccountsSettingsPage() {
  const [result, studio] = await Promise.all([listMyAccounts(), getCurrentStudio()])
  const accounts = result.success ? result.data : []

  return (
    <div>
      <PageHeader kicker="Cuenta" title="Cuentas OFINK" />
      <div className="mx-auto max-w-lg">
        <FeedbackBanner />
        <AccountsManager accounts={accounts} />
        {studio && <DeleteAccountSection isOwner={studio.role === 'owner'} studioName={studio.name} />}
      </div>
    </div>
  )
}
