import { createAdminClient } from '@/lib/supabase/admin'

const WINDOW_MINUTES = 15
const MAX_ATTEMPTS = 8

/** Protección anti fuerza bruta para login/registro por usuario+contraseña.
 * Cuenta intentos fallidos por `identifier` (usuario normalizado + IP) en
 * los últimos 15 minutos; si supera 8, bloquea. */
export async function isRateLimited(identifier: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString()
    const { count } = await admin
      .from('auth_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .gte('created_at', since)

    return (count ?? 0) >= MAX_ATTEMPTS
  } catch {
    // Si la tabla no existe, no bloquear
    return false
  }
}

export async function recordFailedAttempt(identifier: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('auth_attempts').insert({ identifier })
  } catch {
    // Ignorar si la tabla no existe
  }
}

/** IP real del cliente, considerando el proxy de Vercel. */
export function getClientIp(headerList: Headers): string {
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconocida'
}
