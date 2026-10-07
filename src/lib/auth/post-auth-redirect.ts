import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

/** Decide a dónde mandar a alguien recién autenticado (Google o
 * usuario+contraseña), según cuántas cuentas OFINK tiene (ver
 * src/actions/accounts.ts). Compartido entre /auth/callback y las
 * acciones de usuario+contraseña para no duplicar esta lógica. */
export async function resolvePostAuthPath(
  supabase: SupabaseClient,
  userId: string,
  email: string | null
): Promise<string> {
  const { data: accounts } = await supabase.rpc('list_my_accounts')

  if (accounts && accounts.length === 1) {
    await supabase.rpc('set_active_account', { p_artist_id: accounts[0].artist_id })
    return '/dashboard'
  }
  if (accounts && accounts.length >= 2) {
    return '/onboarding/select-account'
  }

  const admin = createAdminClient()
  const { data: pendingInvitation } = await admin
    .from('studio_invitations')
    .select('id')
    .eq('status', 'pending')
    .or(`invited_user_id.eq.${userId},invited_email.ilike.${email ?? ''}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (pendingInvitation) return `/onboarding/studio-invite/${pendingInvitation.id}`

  const { data: joinRequest } = await supabase
    .from('studio_join_requests')
    .select('status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (joinRequest?.status === 'pending') return '/onboarding/pending'

  return '/onboarding/choose'
}
