import type { SupabaseClient } from '@supabase/supabase-js'

/** Decide a dónde mandar a alguien recién autenticado.
 * En Crisbo Tattoo (single-studio), siempre va directo al dashboard.
 * Si el usuario tiene cuenta de artista, la activa automáticamente. */
export async function resolvePostAuthPath(
  supabase: SupabaseClient,
  userId: string,
  _email: string | null
): Promise<string> {
  // Intentar obtener la cuenta del artista y activarla
  const { data: accounts } = await supabase.rpc('list_my_accounts')

  if (accounts && accounts.length >= 1) {
    // Activar la primera cuenta (en single-studio solo hay una)
    await supabase.rpc('set_active_account', { p_artist_id: accounts[0].artist_id })
  }

  // Siempre ir al dashboard - el middleware redirigirá si no tiene permisos
  return '/dashboard'
}
