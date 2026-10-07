'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { revalidatePath } from 'next/cache'

export type MyAccount = {
  artistId: string
  studioId: string
  studioName: string
  accountKind: 'tatuador' | 'estudio'
  role: string
  isActive: boolean
}

/** Fila cruda que retorna el RPC `list_my_accounts` (ver database.types.ts). */
type ListMyAccountsRow = {
  artist_id: string
  studio_id: string
  studio_name: string
  account_kind: string
  role: string
  is_active: boolean
}

/** Todas las cuentas OFINK (filas de `artists`) del usuario autenticado —
 * como máximo 2: una ligada a un studio 'tatuador' y otra a uno 'estudio'.
 * Usa el RPC `list_my_accounts()` (security definer) porque la policy de
 * SELECT de `artists` solo deja ver la cuenta ACTIVA, no todas. */
export async function listMyAccounts(): Promise<Result<MyAccount[]>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const { data, error } = await supabase.rpc('list_my_accounts')
  if (error) return dbError(error)

  const accounts: MyAccount[] = (data ?? []).map((row: ListMyAccountsRow) => ({
    artistId: row.artist_id,
    studioId: row.studio_id,
    studioName: row.studio_name,
    accountKind: row.account_kind === 'estudio' ? 'estudio' : 'tatuador',
    role: row.role,
    isActive: row.is_active,
  }))

  return ok(accounts)
}

/** Marca `artistId` como la cuenta activa del usuario (valida en el propio
 * RPC que la fila pertenezca a quien la llama) y refresca todo el dashboard,
 * que depende de `getCurrentStudio()` → `current_artist_id()`. */
export async function setActiveAccount(artistId: string): Promise<Result<void>> {
  if (!artistId) return err('VALIDATION_ERROR', 'Cuenta inválida')

  const supabase = await createClient()
  const { error } = await supabase.rpc('set_active_account', { p_artist_id: artistId })
  if (error) return err('AUTH_ERROR', 'No se pudo cambiar de cuenta')

  revalidatePath('/dashboard', 'layout')
  return ok(undefined)
}
