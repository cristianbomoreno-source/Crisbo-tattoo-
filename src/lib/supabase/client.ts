import { createBrowserClient } from '@supabase/ssr'

/** Cliente de Supabase para el navegador — hace falta para
 * `signInWithOAuth` (Google), que redirige el propio navegador a Google y
 * no puede hacerse desde una server action. El resto de la app sigue
 * usando el cliente de servidor (`@/lib/supabase/server`) como siempre. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
