import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // No interceptar Server Actions (POST con Next-Action header)
  if (request.method === 'POST' && request.headers.get('next-action')) {
    return NextResponse.next()
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca la sesión si existe
  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas del dashboard (solo GET)
  if (request.method === 'GET') {
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                        request.nextUrl.pathname.startsWith('/register')
    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

    if (!user && isDashboardRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|js|css|json)$).*)',
  ],
}
