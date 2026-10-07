import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'
import { err, ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

type AdminClient = SupabaseClient<Database>

type CreateStudioAndArtistParams = {
  /** Nombre del estudio (artisticName || name en el paso 1; studioName en el onboarding viejo). */
  studioName: string
  userId: string
  /** Nombre que se guarda en artists.name (owner del estudio). */
  artistName: string
  whatsapp?: string | null
  city?: string | null
}

/**
 * Crea studio + artist (owner) para un usuario sin estudio. Reusada por
 * `completeOnboarding` (src/actions/auth.ts, onboarding viejo de 1 paso) y
 * `completeProfileStep` (src/actions/onboarding.ts, paso 1 del onboarding de
 * 8 pasos) — NO duplicar esta lógica en ninguno de los dos.
 *
 * - Slug derivado del nombre; si colisiona (UNIQUE), reintenta una vez con
 *   sufijo aleatorio.
 * - Sin transacción cross-tabla en Supabase: si falla la creación del artist,
 *   se compensa borrando el studio recién creado (evita estudios huérfanos).
 * - Requiere un cliente ADMIN (service role): `artists` no tiene policy de
 *   escritura para `authenticated` (ver 00015_rls_canonicas_sin_recursion.sql
 *   — "Todas las escrituras de artists pasan por el service role").
 */
export async function createStudioAndArtist(
  admin: AdminClient,
  { studioName, userId, artistName, whatsapp, city }: CreateStudioAndArtistParams
): Promise<Result<{ studioId: string; slug: string; artistId: string }>> {
  const baseSlug =
    studioName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'estudio'

  let studio: { id: string; slug: string } | null = null
  for (const slug of [baseSlug, `${baseSlug}-${randomBytes(3).toString('hex')}`]) {
    const { data, error } = await admin
      .from('studios')
      .insert({
        name: studioName,
        slug,
        whatsapp_phone: whatsapp ?? null,
        city: city ?? null,
        onboarding_steps_done: ['profile'],
      })
      .select('id, slug')
      .single()
    if (data) {
      studio = data
      break
    }
    if (error && error.code !== '23505') return dbError(error)
  }
  if (!studio) return err('DB_ERROR', 'No se pudo crear el estudio, intenta de nuevo')

  const { data: artist, error: artistError } = await admin
    .from('artists')
    .insert({
      studio_id: studio.id,
      user_id: userId,
      role: 'owner',
      name: artistName,
    })
    .select('id')
    .single()

  if (artistError || !artist) {
    // Compensación: sin el artist, el studio quedaría huérfano (no hay transacción).
    await admin.from('studios').delete().eq('id', studio.id)
    return artistError ? dbError(artistError) : err('DB_ERROR', 'No se pudo crear el artista')
  }

  return ok({ studioId: studio.id, slug: studio.slug, artistId: artist.id })
}
