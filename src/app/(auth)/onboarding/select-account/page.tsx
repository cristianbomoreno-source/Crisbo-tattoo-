import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listMyAccounts } from '@/actions/accounts'
import { SelectAccountScreen } from '@/components/onboarding/select-account-screen'

/**
 * Selector de cuenta: se muestra cuando el usuario tiene sus 2 cuentas
 * OFINK (una 'tatuador' y otra 'estudio') y acaba de entrar con Google —
 * ver /auth/callback. Elige con cuál continuar cada vez que inicia sesión.
 */
export default async function SelectAccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await listMyAccounts()
  const accounts = result.success ? result.data : []

  if (accounts.length === 0) redirect('/onboarding/choose')
  if (accounts.length === 1) redirect('/dashboard')

  return <SelectAccountScreen accounts={accounts} />
}
