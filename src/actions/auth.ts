'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { err, type Result } from '@/lib/errors/types'
import { normalizeUsername, isValidUsername, usernameToEmail } from '@/lib/auth/username'
import { resolvePostAuthPath } from '@/lib/auth/post-auth-redirect'
import { recordPlatformSignup } from '@/lib/auth/record-signup'
import { isRateLimited, recordFailedAttempt, getClientIp } from '@/lib/auth/rate-limit'

// Crisbo Tattoo: Auth solo por usuario + contraseña. Crea una cuenta de
// Supabase Auth con un correo sintético `usuario@user.ofink.app` (nunca se
// envía nada ahí), creada ya confirmada con el service role, así el username
// hace de identificador único real.
//
// Rate limit (ver lib/auth/rate-limit.ts): tras 8 intentos fallidos en 15
// minutos para el mismo usuario+IP, se bloquea aunque la contraseña sea
// correcta — mitiga fuerza bruta.

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signUpWithUsername(rawUsername: string, password: string): Promise<Result<void>> {
  const username = normalizeUsername(rawUsername)
  if (!isValidUsername(username)) {
    return err('VALIDATION_ERROR', 'Usuario: 3-20 caracteres, solo letras, números, punto o guion bajo')
  }
  if (password.length < 8) return err('VALIDATION_ERROR', 'La contraseña debe tener mínimo 8 caracteres')

  const ip = getClientIp(await headers())
  const identifier = `${username}:${ip}`
  if (await isRateLimited(identifier)) {
    return err('AUTH_ERROR', 'Demasiados intentos. Espera unos minutos y vuelve a intentar')
  }

  const email = usernameToEmail(username)
  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  })
  if (createError || !created.user) {
    await recordFailedAttempt(identifier)
    if (createError?.message.toLowerCase().includes('already')) {
      return err('VALIDATION_ERROR', 'Ese usuario ya existe')
    }
    return err('DB_ERROR', 'No se pudo crear la cuenta')
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return err('AUTH_ERROR', 'Cuenta creada, pero no se pudo iniciar sesión')

  const userAgent = (await headers()).get('user-agent')
  await recordPlatformSignup({
    userId: created.user.id,
    email,
    username,
    authProvider: 'password',
    userAgent,
  })

  const path = await resolvePostAuthPath(supabase, created.user.id, email)
  redirect(path)
}

export async function loginWithUsername(rawUsername: string, password: string): Promise<Result<void>> {
  const username = normalizeUsername(rawUsername)
  if (!username || !password) return err('VALIDATION_ERROR', 'Ingresa usuario y contraseña')

  const ip = getClientIp(await headers())
  const identifier = `${username}:${ip}`
  if (await isRateLimited(identifier)) {
    return err('AUTH_ERROR', 'Demasiados intentos. Espera unos minutos y vuelve a intentar')
  }

  const email = usernameToEmail(username)
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    await recordFailedAttempt(identifier)
    return err('AUTH_ERROR', 'Usuario o contraseña incorrectos')
  }

  const path = await resolvePostAuthPath(supabase, data.user.id, email)
  redirect(path)
}
