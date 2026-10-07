'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Ícono oficial de Google en 4 colores, en trazos simples (sin depender de
 * ningún ícono set nuevo). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.6c-.13 1.06-.86 2.66-2.47 3.74l-.02.15 3.59 2.71.25.02c2.28-2.06 3.57-5.1 3.57-8.29"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.05 7.93-2.86l-3.78-2.86c-1.01.68-2.37 1.16-4.15 1.16-3.18 0-5.88-2.06-6.84-4.92l-.14.01-3.73 2.82-.05.13C3.21 21.3 7.28 24 12 24"
      />
      <path
        fill="#FBBC05"
        d="M5.16 14.52A7.4 7.4 0 0 1 4.75 12c0-.87.16-1.72.4-2.52l-.01-.17-3.78-2.87-.12.06A11.96 11.96 0 0 0 0 12c0 1.94.47 3.77 1.24 5.5l3.92-2.98"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c2.25 0 3.77.97 4.64 1.78l3.39-3.3C17.94 1.19 15.24 0 12 0 7.28 0 3.21 2.7 1.24 6.5l3.91 2.98c.97-2.86 3.67-4.73 6.85-4.73"
      />
    </svg>
  )
}

/** Un solo botón sirve para crear cuenta Y para iniciar sesión — no hay
 * forma de saberlo hasta después de volver de Google, así que el callback
 * (`/auth/callback`) decide: si el usuario ya tiene estudio, va a
 * `/dashboard`; si es la primera vez, a `/onboarding`. */
export function GoogleAuthButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setLoading(false)
    // Si no hay error, el navegador ya está siendo redirigido a Google.
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/10 bg-card px-4 py-4 text-base font-semibold text-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <GoogleIcon />
      {loading ? 'Conectando…' : 'Continuar con Google'}
    </button>
  )
}
