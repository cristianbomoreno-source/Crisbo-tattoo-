import { createAdminClient } from '@/lib/supabase/admin'

/** Guarda (una sola vez por usuario, por `user_id` único) el registro de
 * cómo se creó cada cuenta: correo/usuario, método (Google o contraseña)
 * y si el dispositivo era móvil o escritorio (por user-agent). Alimenta
 * la lista de "Clientes de OFINK" en /admin. */
export async function recordPlatformSignup(params: {
  userId: string
  email: string | null
  username?: string | null
  authProvider: 'google' | 'password'
  userAgent: string | null
}): Promise<void> {
  const device =
    params.userAgent && /Mobile|Android|iPhone|iPad/i.test(params.userAgent) ? 'Móvil' : 'Escritorio'

  const admin = createAdminClient()
  await admin.from('platform_signups').upsert(
    {
      user_id: params.userId,
      email: params.email,
      username: params.username ?? null,
      auth_provider: params.authProvider,
      device,
      user_agent: params.userAgent,
    },
    { onConflict: 'user_id', ignoreDuplicates: true }
  )
}
