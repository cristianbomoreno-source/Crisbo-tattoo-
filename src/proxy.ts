import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Único guard de autenticación de la app. Next.js 16 renombró la convención
 * `middleware.ts` a `proxy.ts` (export `proxy`, no `middleware`) — este
 * archivo ya existía como stub ("deja pasar todo, no hay login real"); acá
 * queda la versión real.
 *
 * Antes de esto, `/` (`src/app/page.tsx`) redirigía SIEMPRE a `/dashboard`
 * sin revisar sesión — si el navegador tenía una cookie de sesión guardada
 * (de una cuenta creada antes), entraba directo a ella; sin sesión, el
 * dashboard igual se renderizaba vacío en vez de pedir login.
 *
 * Ahora: sin sesión válida → `/login`. Con sesión válida → `/dashboard`.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url))
  }
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/register', '/onboarding'],
}
