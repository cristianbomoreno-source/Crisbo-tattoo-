import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudioOnboardingState } from '@/actions/studio-onboarding'
import { listMyAccounts } from '@/actions/accounts'
import { EstudioOnboardingWizard } from '@/components/onboarding/estudio-onboarding-wizard'

export default async function EstudioOnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getStudioOnboardingState()
  if (!result.success) redirect('/onboarding/choose')

  // Si el usuario todavía no tiene una cuenta 'estudio' (ver
  // getStudioOnboardingState, ya resuelve esto específicamente y no según
  // la cuenta activa), este flujo la crea — como cuenta única (registro
  // normal) o como SEGUNDA cuenta si ya tiene una 'tatuador' (desde
  // Ajustes → Cuentas OFINK → "Crear cuenta de Estudio"). Solo se bloquea
  // si ya llegó al máximo de 2 cuentas OFINK.
  if (!result.data.hasStudio) {
    const accountsResult = await listMyAccounts()
    const accountCount = accountsResult.success ? accountsResult.data.length : 0
    if (accountCount >= 2) redirect('/dashboard')
  }

  return <EstudioOnboardingWizard initial={result.data} />
}
