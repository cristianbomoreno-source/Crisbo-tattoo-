import type { SupabaseClient } from '@supabase/supabase-js'
import { refreshInstagramToken, type IgAccountCredentials } from './api'

/** Renovar el token cada semana: dura 60 días y así nunca caduca mientras
 * el estudio siga usando la bandeja. */
const REFRESH_EVERY_MS = 7 * 24 * 60 * 60 * 1000

type Row = { studio_id: string; ig_user_id: string; access_token: string; token_refreshed_at: string }

async function withFreshToken(admin: SupabaseClient, row: Row): Promise<IgAccountCredentials & { studio_id: string }> {
  if (Date.now() - new Date(row.token_refreshed_at).getTime() > REFRESH_EVERY_MS) {
    try {
      const token = await refreshInstagramToken(row.access_token)
      await admin
        .from('instagram_accounts')
        .update({ access_token: token, token_refreshed_at: new Date().toISOString() })
        .eq('studio_id', row.studio_id)
      row.access_token = token
    } catch (e) {
      // Se sigue con el token actual; se reintenta en el próximo uso.
      console.error('[instagram] No se pudo renovar el token', e)
    }
  }
  return { studio_id: row.studio_id, ig_user_id: row.ig_user_id, access_token: row.access_token }
}

const COLUMNS = 'studio_id, ig_user_id, access_token, token_refreshed_at'

/** Cuenta de Instagram del estudio (cliente admin: la tabla no tiene RLS de lectura). */
export async function loadInstagramAccount(admin: SupabaseClient, studioId: string) {
  const { data } = await admin.from('instagram_accounts').select(COLUMNS).eq('studio_id', studioId).maybeSingle()
  return data ? withFreshToken(admin, data as Row) : null
}

/** Cuenta por el id que llega en el webhook (entry.id). */
export async function loadInstagramAccountByIgUser(admin: SupabaseClient, igUserId: string) {
  const { data } = await admin.from('instagram_accounts').select(COLUMNS).eq('ig_user_id', igUserId).maybeSingle()
  return data ? withFreshToken(admin, data as Row) : null
}
