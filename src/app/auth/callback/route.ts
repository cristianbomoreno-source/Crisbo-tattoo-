import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolvePostAuthPath } from '@/lib/auth/post-auth-redirect'
import { recordPlatformSignup } from '@/lib/auth/record-signup'

/**
 * Destino del redirect de Google tras `signInWithOAuth` (ver botón
 * "Continuar con Google" en login/register — el otro método es
 * usuario+contraseña, ver src/actions/auth.ts). Intercambia el `code` por
 * una sesión y usa `resolvePostAuthPath` (compartida con usuario+contraseña)
 * para decidir a dónde mandar al usuario.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      await recordPlatformSignup({
        userId: data.user.id,
        email: data.user.email ?? null,
        authProvider: 'google',
        userAgent: request.headers.get('user-agent'),
      })

      const path = await resolvePostAuthPath(supabase, data.user.id, data.user.email ?? null)
      return NextResponse.redirect(`${origin}${path}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=No se pudo iniciar sesión con Google`)
}
