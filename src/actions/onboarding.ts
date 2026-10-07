'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { createStudioAndArtist } from '@/lib/onboarding/create-studio'
import { initTourProgress } from '@/lib/tour/init-tour-progress'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/types/database.types'
import {
  profileStepSchema,
  specialtyStepSchema,
  experienceStepSchema,
  studioStepSchema,
  socialsStepSchema,
  depositStepSchema,
  policiesStepSchema,
  type OnboardingStepKey,
} from '@/lib/validations/onboarding'
import { ONBOARDING_STEPS } from '@/components/onboarding/constants'

type StudioUpdate = Database['public']['Tables']['studios']['Update']
type ArtistUpdate = Database['public']['Tables']['artists']['Update']

/** Busca la cuenta (fila `artists`) del usuario cuyo estudio sea de tipo
 * 'tatuador' — específicamente esa, sin importar cuál esté activa ahora
 * mismo (`current_artist_id()`). Simétrico a `findMyEstudioAccount` en
 * `src/actions/studio-onboarding.ts`: así alguien que ya tiene una cuenta
 * 'estudio' puede crear/editar, además, su cuenta de tatuador independiente
 * sin que este wizard toque el estudio del que es dueño. Usa admin porque
 * necesita ver ambas filas del usuario, sin la restricción de la policy
 * de `artists` (que solo deja ver la cuenta activa). */
async function findMyTatuadorAccount(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<{ artistId: string; studioId: string } | null> {
  const { data } = await admin
    .from('artists')
    .select('id, studio_id, studio:studios!inner(account_kind)')
    .eq('user_id', userId)
    .eq('studio.account_kind', 'tatuador')
    .maybeSingle()
  if (!data) return null
  return { artistId: data.id, studioId: data.studio_id as string }
}

/** Claves guardables por `saveOnboardingStep` — todas menos 'profile' (tiene
 * su propia action, `completeProfileStep`) y 'review' (la marca `finishOnboarding`). */
type SaveableStepKey = Exclude<OnboardingStepKey, 'profile' | 'review'>
const SAVEABLE_STEP_KEYS: SaveableStepKey[] = ONBOARDING_STEPS.map((s) => s.key).filter(
  (key): key is SaveableStepKey => key !== 'profile' && key !== 'review'
)

function isSaveableStep(step: unknown): step is SaveableStepKey {
  return typeof step === 'string' && (SAVEABLE_STEP_KEYS as string[]).includes(step)
}

/** Exige sesión + estudio ya creado (paso 'profile' completado) + dueño.
 * Mismo patrón que `requireOwner` en src/actions/studio.ts, más el userId
 * (lo necesitan los pasos que escriben en `artists`, p.ej. 'experience'). */
async function requireOnboardingContext(): Promise<
  Result<{ studioId: string; artistId: string; userId: string }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const account = await findMyTatuadorAccount(createAdminClient(), user.id)
  if (!account) return err('VALIDATION_ERROR', 'Completa primero el paso de perfil')

  return ok({ studioId: account.studioId, artistId: account.artistId, userId: user.id })
}

/** Agrega `step` a `onboarding_steps_done` sin duplicar (Set) y aplica `fields`
 * (si los hay) en la misma UPDATE de `studios`. Usa el cliente normal (RLS
 * `studio_member_update` ya permite que un miembro actualice su estudio). */
async function updateStudioStep(
  studioId: string,
  fields: StudioUpdate,
  step: OnboardingStepKey,
  opts: { slugUnique?: boolean } = {}
): Promise<Result<void>> {
  const supabase = await createClient()

  const { data: current, error: selErr } = await supabase
    .from('studios')
    .select('onboarding_steps_done')
    .eq('id', studioId)
    .single()
  if (selErr) return dbError(selErr)

  const nextSteps = Array.from(new Set([...(current?.onboarding_steps_done ?? []), step]))

  const { error } = await supabase
    .from('studios')
    .update({ ...fields, onboarding_steps_done: nextSteps })
    .eq('id', studioId)
  if (error) {
    if (opts.slugUnique && error.code === '23505')
      return err('VALIDATION_ERROR', 'Ese enlace ya está en uso')
    return dbError(error)
  }

  revalidatePath('/onboarding')
  revalidatePath('/dashboard', 'layout')
  return ok(undefined)
}

/** Paso 'experience': UPDATE parcial de `artists` (requiere admin — `artists`
 * no tiene policy de escritura para `authenticated`, ver 00015 RLS) + marca
 * el paso en `studios.onboarding_steps_done` vía `updateStudioStep`. */
async function updateArtistStep(
  studioId: string,
  artistId: string,
  fields: ArtistUpdate,
  step: OnboardingStepKey
): Promise<Result<void>> {
  if (Object.keys(fields).length > 0) {
    const admin = createAdminClient()
    const { error } = await admin.from('artists').update(fields).eq('id', artistId)
    if (error) return dbError(error)
  }
  return updateStudioStep(studioId, {}, step)
}

/**
 * Paso 1 (OBLIGATORIO). Si el usuario no tiene estudio, lo crea (reusa
 * `createStudioAndArtist`, la misma lógica de `completeOnboarding`). Si ya
 * lo tiene (reingreso o usuario existente), actualiza los campos provistos.
 */
export async function completeProfileStep(
  input: unknown
): Promise<Result<{ studioId: string; slug: string }>> {
  const parsed = profileStepSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos de perfil inválidos')
  const { name, artisticName, city, whatsapp } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  // Admin client: bypassea RLS tanto para la creación inicial como para el
  // update de `artists.name` (sin policy de escritura para `authenticated`).
  const admin = createAdminClient()

  // Resuelve específicamente la cuenta 'tatuador' del usuario (no
  // "cualquier fila") — así, si ya tiene una cuenta 'estudio' activa, este
  // paso 1 crea/edita SU cuenta de tatuador sin tocar el estudio del que
  // es dueño (ver findMyTatuadorAccount, simétrico a
  // findMyEstudioAccount en studio-onboarding.ts).
  const existingTatuador = await findMyTatuadorAccount(admin, user.id)

  if (!existingTatuador) {
    const { count: accountCount } = await admin
      .from('artists')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((accountCount ?? 0) >= 2)
      return err('VALIDATION_ERROR', 'Ya tienes el máximo de 2 cuentas OFINK')

    const metaWhatsapp = (user.user_metadata['whatsapp'] as string | undefined) ?? null
    const created = await createStudioAndArtist(admin, {
      studioName: artisticName?.trim() || name,
      userId: user.id,
      artistName: name,
      whatsapp: whatsapp || metaWhatsapp,
      city: city || null,
    })
    if (!created.success) return created
    await supabase.rpc('set_active_account', { p_artist_id: created.data.artistId })
    await initTourProgress(admin, created.data.artistId, 'tatuador')
    return ok({ studioId: created.data.studioId, slug: created.data.slug })
  }

  const studioId = existingTatuador.studioId

  const { data: current, error: selErr } = await admin
    .from('studios')
    .select('onboarding_steps_done, slug')
    .eq('id', studioId)
    .single()
  if (selErr) return dbError(selErr)
  if (!current) return err('DB_ERROR', 'Estudio no encontrado')

  const nextSteps = Array.from(new Set([...current.onboarding_steps_done, 'profile']))

  const studioFields: StudioUpdate = { onboarding_steps_done: nextSteps }
  if (artisticName) studioFields.name = artisticName.trim()
  if (city !== undefined) studioFields.city = city || null
  if (whatsapp !== undefined) studioFields.whatsapp_phone = whatsapp || null

  const { error: studioErr } = await admin.from('studios').update(studioFields).eq('id', studioId)
  if (studioErr) return dbError(studioErr)

  const { error: artistErr } = await admin
    .from('artists')
    .update({ name })
    .eq('id', existingTatuador.artistId)
  if (artistErr) return dbError(artistErr)

  revalidatePath('/onboarding')
  revalidatePath('/dashboard', 'layout')
  return ok({ studioId, slug: current.slug })
}

/**
 * Pasos 2,3,5,6,7 (más 4, obligatorio pero mismo mecanismo). Valida `step`
 * contra las claves guardables, parsea `input` con el schema del paso, y
 * hace un UPDATE parcial (studios u artists según el paso).
 */
export async function saveOnboardingStep(step: unknown, input: unknown): Promise<Result<void>> {
  if (!isSaveableStep(step)) return err('VALIDATION_ERROR', 'Paso de onboarding inválido')

  const gate = await requireOnboardingContext()
  if (!gate.success) return gate
  const { studioId, artistId } = gate.data

  switch (step) {
    case 'specialty': {
      const parsed = specialtyStepSchema.safeParse(input)
      if (!parsed.success)
        return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos de especialidad inválidos')

      const fields: StudioUpdate = {}
      if (parsed.data.styles !== undefined || parsed.data.otherStyle !== undefined) {
        const other = parsed.data.otherStyle?.trim()
        fields.styles = [...(parsed.data.styles ?? []), ...(other ? [other] : [])]
      }
      return updateStudioStep(studioId, fields, step)
    }

    case 'experience': {
      const parsed = experienceStepSchema.safeParse(input)
      if (!parsed.success)
        return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos de experiencia inválidos')

      const fields: ArtistUpdate = {}
      if (parsed.data.experienceRange !== undefined) fields.experience_range = parsed.data.experienceRange
      if (parsed.data.fullTime !== undefined) fields.full_time = parsed.data.fullTime
      if (parsed.data.ownStudio !== undefined) fields.own_studio = parsed.data.ownStudio
      return updateArtistStep(studioId, artistId, fields, step)
    }

    case 'studio': {
      const parsed = studioStepSchema.safeParse(input)
      if (!parsed.success)
        return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos del estudio inválidos')

      const fields: StudioUpdate = {
        studio_type: parsed.data.studioType,
        open_days: parsed.data.openDays,
      }
      if (parsed.data.address !== undefined) fields.address = parsed.data.address
      if (parsed.data.mapsUrl !== undefined) fields.maps_url = parsed.data.mapsUrl
      if (parsed.data.artistCount !== undefined) fields.artist_count = parsed.data.artistCount
      if (parsed.data.openTime !== undefined) fields.open_time = parsed.data.openTime
      if (parsed.data.closeTime !== undefined) fields.close_time = parsed.data.closeTime
      return updateStudioStep(studioId, fields, step)
    }

    case 'socials': {
      const parsed = socialsStepSchema.safeParse(input)
      if (!parsed.success)
        return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos de redes inválidos')

      const fields: StudioUpdate = {}
      if (parsed.data.instagram !== undefined) fields.instagram = parsed.data.instagram || null
      if (parsed.data.tiktok !== undefined) fields.tiktok = parsed.data.tiktok || null
      if (parsed.data.facebook !== undefined) fields.facebook = parsed.data.facebook || null
      if (parsed.data.website !== undefined) fields.website = parsed.data.website || null
      // El slug SOLO se toca si viene: unicidad la garantiza el UNIQUE de
      // studios.slug — 23505 se traduce a un mensaje claro (mismo patrón que
      // updateBotSettings en src/actions/studio.ts).
      if (parsed.data.slug !== undefined) fields.slug = parsed.data.slug
      return updateStudioStep(studioId, fields, step, { slugUnique: true })
    }

    case 'deposit': {
      const parsed = depositStepSchema.safeParse(input)
      if (!parsed.success)
        return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos de abono inválidos')

      const fields: StudioUpdate = {}
      if (parsed.data.depositMode !== undefined) fields.deposit_mode = parsed.data.depositMode
      if (parsed.data.depositValue !== undefined) fields.deposit_value = parsed.data.depositValue
      return updateStudioStep(studioId, fields, step)
    }

    case 'policies': {
      const parsed = policiesStepSchema.safeParse(input)
      if (!parsed.success)
        return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos de políticas inválidos')

      const fields: StudioUpdate = {}
      if (parsed.data.paymentPolicy !== undefined) fields.payment_policy = parsed.data.paymentPolicy
      if (parsed.data.cancellationPolicy !== undefined)
        fields.cancellation_policy = parsed.data.cancellationPolicy
      if (parsed.data.rules !== undefined) fields.studio_rules = parsed.data.rules
      return updateStudioStep(studioId, fields, step)
    }
  }
}

/** Paso 8: marca 'review' (set completo) sin tocar campos. */
/** Código de día ('LUN'..'DOM', ver WEEK_DAYS en components/onboarding/constants.ts)
 * para el `getUTCDay()` de una fecha (0=domingo..6=sábado). */
const WEEKDAY_CODE_BY_INDEX = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const

/** Auto-bloquea en el calendario (`blocked_days`) los días de la semana que
 * el estudio NO marcó como días de atención en el paso 4 (spec: "automáticamente
 * configura los días que no trabaja en el calendario"). Genera 90 días hacia
 * adelante desde hoy — suficiente para que el calendario (que solo carga un
 * rango visible a la vez) ya los muestre bloqueados en cuanto el estudio
 * exista, sin bloquear el resto de su vida de una sola vez.
 *
 * Reutiliza 100% la tabla/mecanismo YA existente de "Fechas especiales"
 * (Ajustes → Fechas, `blocked_days`) — el estudio puede desbloquear
 * cualquiera de estos días igual que cualquier otro (spec: "poder
 * configurarlo"). `upsert` con `onConflict` evita duplicar si el usuario
 * repite el onboarding o ya tenía algo bloqueado ese día. */
async function autoBlockNonWorkingDays(studioId: string): Promise<void> {
  const admin = createAdminClient()
  const { data: studio } = await admin.from('studios').select('open_days').eq('id', studioId).maybeSingle()
  const openDays = new Set((studio?.open_days as string[] | null) ?? [])
  // Sin días configurados: no se asume nada (evita bloquear la semana entera
  // por un estudio que todavía no llegó al paso 4 o lo saltó).
  if (openDays.size === 0) return

  const FORWARD_DAYS = 90
  const rows: { studio_id: string; date: string; reason: string }[] = []
  const today = new Date()
  for (let i = 0; i < FORWARD_DAYS; i++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i))
    const code = WEEKDAY_CODE_BY_INDEX[d.getUTCDay()]!
    if (openDays.has(code)) continue
    rows.push({ studio_id: studioId, date: d.toISOString().slice(0, 10), reason: 'Día no laboral' })
  }
  if (rows.length === 0) return

  await admin.from('blocked_days').upsert(rows, { onConflict: 'studio_id,date', ignoreDuplicates: true })
}

export async function finishOnboarding(): Promise<Result<void>> {
  const gate = await requireOnboardingContext()
  if (!gate.success) return gate
  const result = await updateStudioStep(gate.data.studioId, {}, 'review')
  if (!result.success) return result
  await autoBlockNonWorkingDays(gate.data.studioId)
  return ok(undefined)
}

export type OnboardingPrefill = {
  name: string
  artisticName: string
  city: string
  whatsapp: string
  styles: string[]
  otherStyle: string
  experienceRange: string
  fullTime: boolean | undefined
  ownStudio: boolean | undefined
  studioType: string
  address: string
  mapsUrl: string
  artistCount: string
  openDays: string[]
  openTime: string
  closeTime: string
  instagram: string
  tiktok: string
  facebook: string
  website: string
  slug: string
  depositMode: string
  depositValue: number | undefined
  paymentPolicy: string
  cancellationPolicy: string
  rules: string[]
}

type StudioPrefillRow = {
  name: string
  slug: string
  city: string | null
  whatsapp_phone: string | null
  studio_type: string | null
  address: string | null
  maps_url: string | null
  artist_count: string | null
  open_days: string[] | null
  open_time: string | null
  close_time: string | null
  instagram: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  deposit_mode: string | null
  deposit_value: number | null
  payment_policy: string | null
  cancellation_policy: string | null
  studio_rules: string[] | null
  styles: string[] | null
  onboarding_steps_done: string[]
}

/**
 * Estado del onboarding para la página server: si ya hay estudio, qué pasos
 * quedaron marcados, y el prellenado (metadata del registro + valores
 * actuales del estudio/artista, para reingreso a mitad de camino).
 */
export async function getOnboardingState(): Promise<
  Result<{ hasStudio: boolean; stepsDone: OnboardingStepKey[]; prefill: OnboardingPrefill }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  const metaName = (user.user_metadata['name'] as string | undefined) ?? ''
  const metaWhatsapp = (user.user_metadata['whatsapp'] as string | undefined) ?? ''

  const account = await findMyTatuadorAccount(createAdminClient(), user.id)

  const { data } = account
    ? await createAdminClient()
        .from('artists')
        .select(
          'name, experience_range, full_time, own_studio, studio:studios(name, slug, city, whatsapp_phone, studio_type, address, maps_url, artist_count, open_days, open_time, close_time, instagram, tiktok, facebook, website, deposit_mode, deposit_value, payment_policy, cancellation_policy, studio_rules, styles, onboarding_steps_done)'
        )
        .eq('id', account.artistId)
        .maybeSingle()
    : { data: null }

  const studio = (data?.studio as unknown as StudioPrefillRow | null) ?? null
  const hasStudio = !!studio
  const stepsDone = (studio?.onboarding_steps_done ?? []) as OnboardingStepKey[]

  const prefill: OnboardingPrefill = {
    name: (data?.name as string | undefined) || metaName,
    artisticName: studio?.name ?? '',
    city: studio?.city ?? '',
    whatsapp: studio?.whatsapp_phone ?? metaWhatsapp,
    styles: studio?.styles ?? [],
    otherStyle: '',
    experienceRange: (data?.experience_range as string | undefined) ?? '',
    fullTime: (data?.full_time as boolean | null | undefined) ?? undefined,
    ownStudio: (data?.own_studio as boolean | null | undefined) ?? undefined,
    studioType: studio?.studio_type ?? '',
    address: studio?.address ?? '',
    mapsUrl: studio?.maps_url ?? '',
    artistCount: studio?.artist_count ?? '',
    openDays: studio?.open_days ?? [],
    openTime: studio?.open_time ?? '',
    closeTime: studio?.close_time ?? '',
    instagram: studio?.instagram ?? '',
    tiktok: studio?.tiktok ?? '',
    facebook: studio?.facebook ?? '',
    website: studio?.website ?? '',
    slug: studio?.slug ?? '',
    depositMode: studio?.deposit_mode ?? '',
    depositValue: studio?.deposit_value ?? undefined,
    paymentPolicy: studio?.payment_policy ?? '',
    cancellationPolicy: studio?.cancellation_policy ?? '',
    rules: studio?.studio_rules ?? [],
  }

  return ok({ hasStudio, stepsDone, prefill })
}
