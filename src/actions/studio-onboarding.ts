'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { createStudioAndArtist } from '@/lib/onboarding/create-studio'
import { initTourProgress } from '@/lib/tour/init-tour-progress'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/types/database.types'

type StudioUpdate = Database['public']['Tables']['studios']['Update']

/** Busca la cuenta (fila `artists`) del usuario cuyo estudio sea de tipo
 * 'estudio' — específicamente esa, sin importar cuál esté activa en este
 * momento (`current_artist_id()`). Así una persona puede tener a la vez
 * una cuenta 'tatuador' (independiente) y otra 'estudio' (dueño), y este
 * flujo siempre opera sobre la segunda. Usa admin porque necesita ver
 * ambas filas del usuario, sin la restricción de la policy de `artists`. */
async function findMyEstudioAccount(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<{ artistId: string; studioId: string } | null> {
  const { data } = await admin
    .from('artists')
    .select('id, studio_id, studio:studios!inner(account_kind)')
    .eq('user_id', userId)
    .eq('studio.account_kind', 'estudio')
    .maybeSingle()
  if (!data) return null
  return { artistId: data.id, studioId: data.studio_id as string }
}

/** Paso 1 del flujo "Tengo un estudio": crea el estudio SIN pedir datos del
 * propietario (spec: "Primero crear el estudio"). Reusa `createStudioAndArtist`
 * (misma función que el registro de tatuador) — el nombre del artista/owner
 * se prellena del registro (Google/correo) y se puede completar después en
 * Ajustes → Perfil del artista, sin bloquear este flujo. */
export async function createStudioOnboarding(input: {
  name: string
  city?: string
  whatsapp?: string
  instagram?: string
}): Promise<Result<{ studioId: string; slug: string; joinCode: string }>> {
  if (!input.name.trim()) return err('VALIDATION_ERROR', 'Ingresa el nombre del estudio')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()

  // Solo bloquea si YA tiene una cuenta 'estudio' — puede tener, además,
  // una cuenta 'tatuador' independiente sin problema (hasta 2 cuentas por
  // usuario, ver src/actions/accounts.ts).
  const existingEstudio = await findMyEstudioAccount(admin, user.id)
  if (existingEstudio) return err('VALIDATION_ERROR', 'Ya tienes una cuenta de estudio')

  const { count: accountCount } = await admin
    .from('artists')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if ((accountCount ?? 0) >= 2) return err('VALIDATION_ERROR', 'Ya tienes el máximo de 2 cuentas OFINK')

  const metaName = (user.user_metadata['name'] as string | undefined) ?? user.email?.split('@')[0] ?? 'Propietario'
  const metaWhatsapp = (user.user_metadata['whatsapp'] as string | undefined) ?? null

  const created = await createStudioAndArtist(admin, {
    studioName: input.name.trim(),
    userId: user.id,
    artistName: metaName,
    whatsapp: input.whatsapp || metaWhatsapp,
    city: input.city || null,
  })
  if (!created.success) return created

  if (input.instagram) {
    await admin.from('studios').update({ instagram: input.instagram }).eq('id', created.data.studioId)
  }
  await admin.from('studios').update({ account_kind: 'estudio' }).eq('id', created.data.studioId)

  const { data: studio } = await admin
    .from('studios')
    .select('join_code')
    .eq('id', created.data.studioId)
    .single()

  // Activa la cuenta recién creada: si el usuario ya tenía una cuenta
  // 'tatuador' activa, sin esto el resto del wizard (pasos 2-5, que leen
  // vía getCurrentStudio()/current_artist_id()) seguiría viendo la cuenta
  // vieja en vez del estudio que se acaba de crear.
  await supabase.rpc('set_active_account', { p_artist_id: created.data.artistId })
  await initTourProgress(admin, created.data.artistId, 'estudio')

  revalidatePath('/dashboard', 'layout')
  return ok({
    studioId: created.data.studioId,
    slug: created.data.slug,
    joinCode: studio?.join_code ?? '',
  })
}

/** Pasos 2-5 (características, espacio, políticas, personalización): un solo
 * UPDATE genérico — cada paso del wizard le manda solo los campos que le
 * corresponden. Requiere ser el owner del estudio (RLS "Studio members
 * manage their studio" ya lo exige; se repite el chequeo de rol por
 * claridad del error). */
export async function updateStudioOnboarding(fields: StudioUpdate): Promise<Result<void>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const admin = createAdminClient()
  const account = await findMyEstudioAccount(admin, user.id)
  if (!account) return err('AUTH_ERROR', 'No tienes una cuenta de estudio')

  // RLS "Studio members manage their studio" permite editar cualquiera de
  // los estudios del usuario (no solo el de la cuenta activa), así que el
  // cliente normal basta aquí.
  const { error } = await supabase.from('studios').update(fields).eq('id', account.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard', 'layout')
  return ok(undefined)
}

export type StudioOnboardingState = {
  hasStudio: boolean
  studioId: string | null
  name: string
  city: string
  whatsapp: string
  instagram: string
  studioType: string
  artistCount: string
  acceptsResidents: boolean
  openDays: string[]
  openTime: string
  closeTime: string
  slotIntervalMinutes: number
  cabins: number | null
  stations: number | null
  depositMode: string
  depositValue: number | undefined
  paymentPolicy: string
  cancellationPolicy: string
  rules: string[]
  logoUrl: string | null
  coverPhotoUrl: string | null
  quoteTemplateColor: string
  description: string
  website: string
  tiktok: string
  facebook: string
  joinCode: string
  slug: string
}

/** Estado para reingreso: si el usuario ya creó el estudio (paso 1 hecho) y
 * abandonó el wizard, esto prellena todo lo que ya guardó. */
export async function getStudioOnboardingState(): Promise<Result<StudioOnboardingState>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const account = user ? await findMyEstudioAccount(createAdminClient(), user.id) : null

  if (!user || !account) {
    return ok({
      hasStudio: false,
      studioId: null,
      name: '',
      city: '',
      whatsapp: '',
      instagram: '',
      studioType: '',
      artistCount: '',
      acceptsResidents: true,
      openDays: [],
      openTime: '',
      closeTime: '',
      slotIntervalMinutes: 30,
      cabins: null,
      stations: null,
      depositMode: '',
      depositValue: undefined,
      paymentPolicy: '',
      cancellationPolicy: '',
      rules: [],
      logoUrl: null,
      coverPhotoUrl: null,
      quoteTemplateColor: 'green',
      description: '',
      website: '',
      tiktok: '',
      facebook: '',
      joinCode: '',
      slug: '',
    })
  }

  const { data } = await supabase
    .from('studios')
    .select(
      'id, name, slug, city, whatsapp_phone, instagram, studio_type, artist_count, open_days, open_time, close_time, slot_interval_minutes, deposit_mode, deposit_value, payment_policy, cancellation_policy, studio_rules, logo_url, cover_photo_url, quote_template_color, website, tiktok, facebook, accepts_residents, cabins, stations, description, join_code'
    )
    .eq('id', account.studioId)
    .single()
  if (!data) return err('DB_ERROR', 'Estudio no encontrado')

  return ok({
    hasStudio: true,
    studioId: data.id,
    name: data.name,
    city: data.city ?? '',
    whatsapp: data.whatsapp_phone ?? '',
    instagram: data.instagram ?? '',
    studioType: data.studio_type ?? '',
    artistCount: data.artist_count ?? '',
    acceptsResidents: data.accepts_residents ?? true,
    openDays: data.open_days ?? [],
    openTime: data.open_time ?? '',
    closeTime: data.close_time ?? '',
    slotIntervalMinutes: data.slot_interval_minutes ?? 30,
    cabins: data.cabins ?? null,
    stations: data.stations ?? null,
    depositMode: data.deposit_mode ?? '',
    depositValue: data.deposit_value ?? undefined,
    paymentPolicy: data.payment_policy ?? '',
    cancellationPolicy: data.cancellation_policy ?? '',
    rules: data.studio_rules ?? [],
    logoUrl: data.logo_url,
    coverPhotoUrl: data.cover_photo_url,
    quoteTemplateColor: data.quote_template_color ?? 'green',
    description: data.description ?? '',
    website: data.website ?? '',
    tiktok: data.tiktok ?? '',
    facebook: data.facebook ?? '',
    joinCode: data.join_code ?? '',
    slug: data.slug,
  })
}
