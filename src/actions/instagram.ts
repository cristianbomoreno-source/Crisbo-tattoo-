'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'
import { fetchInstagramMe, subscribeInstagramWebhooks } from '@/lib/instagram/api'

/* ─────────────── Conexión de la cuenta (Ajustes → Instagram) ─────────────── */

const tokenSchema = z.string().trim().min(20, 'Pega el token de acceso de Instagram').max(2000)

export async function saveInstagramAccount(
  token: unknown
): Promise<Result<{ username: string | null; webhookWarning: string | null }>> {
  const parsed = tokenSchema.safeParse(token)
  if (!parsed.success) return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Token inválido')

  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede conectar Instagram')

  // Antes de guardar: comprobar que Instagram acepta el token.
  let me: Awaited<ReturnType<typeof fetchInstagramMe>>
  try {
    me = await fetchInstagramMe(parsed.data)
  } catch (e) {
    return err('VALIDATION_ERROR', `Instagram rechazó el token: ${(e as Error).message}`)
  }
  const igUserId = me.user_id || me.id
  if (me.account_type && !['BUSINESS', 'MEDIA_CREATOR', 'CREATOR'].includes(me.account_type)) {
    return err('VALIDATION_ERROR', 'La cuenta debe ser profesional (Empresa o Creador) para recibir mensajes por la API.')
  }

  const { error } = await createAdminClient()
    .from('instagram_accounts')
    .upsert(
      {
        studio_id: studio.id,
        ig_user_id: igUserId,
        username: me.username ?? null,
        access_token: parsed.data,
        token_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'studio_id' }
    )
  if (error) {
    if (error.code === '23505') return err('VALIDATION_ERROR', 'Esa cuenta de Instagram ya está conectada a otro estudio')
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return err('VALIDATION_ERROR', 'Falta crear la tabla instagram_accounts (instagram-inbox.sql) en Supabase.')
    }
    return dbError(error)
  }

  let webhookWarning: string | null = null
  try {
    await subscribeInstagramWebhooks(parsed.data)
  } catch (e) {
    webhookWarning = `Cuenta guardada, pero Instagram no activó los mensajes: ${(e as Error).message}`
  }

  revalidatePath('/dashboard/settings/instagram')
  revalidatePath('/dashboard/inbox', 'layout')
  return ok({ username: me.username ?? null, webhookWarning })
}

export async function disconnectInstagramAccount(): Promise<Result<null>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner') return err('FORBIDDEN', 'Solo el dueño del estudio puede desconectar Instagram')

  const { error } = await createAdminClient().from('instagram_accounts').delete().eq('studio_id', studio.id)
  if (error) return dbError(error)
  revalidatePath('/dashboard/settings/instagram')
  revalidatePath('/dashboard/inbox', 'layout')
  return ok(null)
}
