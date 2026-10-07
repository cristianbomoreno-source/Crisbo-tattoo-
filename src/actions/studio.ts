'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStudio } from '@/queries/studio'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import {
  updateStudioNameSchema,
  updateQuoteTemplateSchema,
  updateMessageTemplatesSchema,
  updateQuoteLandingSchema,
  updateMonthlyGoalsSchema,
  updateBotSettingsSchema,
  updateStudioProfileSchema,
  updateStudioSlugSchema,
  updateStudioScheduleSchema,
  updateStudioDepositSchema,
  updateStudioPaymentMethodsSchema,
  updateStudioPoliciesSchema,
  updateArtistProfileSchema,
  updatePricePresetsSchema,
  updateSlotIntervalSchema,
  LOGO_MAX_BYTES,
  LOGO_ALLOWED_TYPES,
} from '@/lib/validations/studio'
import { normalizePhone } from '@/lib/intake/phone'
import { revalidatePath } from 'next/cache'

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

/** Exige que el usuario sea dueño; devuelve el id del estudio. */
async function requireOwner(): Promise<Result<{ studioId: string }>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  if (studio.role !== 'owner')
    return err('AUTH_ERROR', 'Solo el dueño del estudio puede editar la marca')
  return ok({ studioId: studio.id })
}

export async function updateStudioName(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateStudioNameSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Nombre inválido')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({ name: parsed.data.name })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

export async function updateQuoteTemplateColor(colorId: string): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  if (!['green', 'white', 'blue', 'red'].includes(colorId)) {
    return err('VALIDATION_ERROR', 'Color inválido')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({ quote_template_color: colorId })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

export async function updateQuoteTemplate(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateQuoteTemplateSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Mensaje inválido')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({ quote_message_template: parsed.data.quote_message_template })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Las 4 plantillas de WhatsApp (Ajustes → Personalización → Plantillas de
 * WhatsApp): cotización + saldo pendiente + sesión + contacto general.
 * Reemplaza a `updateQuoteTemplate` para el formulario (que ahora edita las
 * 4 de una vez); se deja `updateQuoteTemplate` intacta por si algo más la usa. */
export async function updateMessageTemplates(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateMessageTemplatesSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Mensaje inválido')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({
      quote_message_template: parsed.data.quote_message_template,
      reminder_balance_template: parsed.data.reminder_balance_template,
      reminder_session_template: parsed.data.reminder_session_template,
      contact_client_template: parsed.data.contact_client_template,
      bot_contact_template: parsed.data.bot_contact_template,
      quote_confirm_template: parsed.data.quote_confirm_template,
      booking_confirmation_template: parsed.data.booking_confirmation_template,
    })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Carta del tatuador y negociación de precio en la landing del proyecto
 * (`/proyecto/[token]`) — ver `quote-letter-form.tsx`. */
export async function updateQuoteLandingSettings(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateQuoteLandingSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({
      quote_letter_message: parsed.data.quote_letter_message || null,
      quote_price_negotiable: parsed.data.quote_price_negotiable,
    })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Metas mensuales del estudio (Ajustes → Estudio → Metas) — usadas por el
 * dashboard de Estadísticas (`/dashboard/stats`) para las barras de "Meta
 * del mes" y "Objetivo del mes". Campo en null = sin meta definida. */
export async function updateMonthlyGoals(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateMonthlyGoalsSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({
      monthly_goal_quoted_value: parsed.data.monthly_goal_quoted_value,
      monthly_goal_approved_projects: parsed.data.monthly_goal_approved_projects,
      monthly_goal_scheduled_sessions: parsed.data.monthly_goal_scheduled_sessions,
    })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/stats')
  return ok(undefined)
}

export async function updateBotSettings(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateBotSettingsSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const phone = parsed.data.whatsapp_phone === '' ? null : normalizePhone(parsed.data.whatsapp_phone)
  if (parsed.data.whatsapp_phone !== '' && !phone)
    return err('VALIDATION_ERROR', 'Número de WhatsApp inválido')

  const instagram = parsed.data.instagram ? parsed.data.instagram : null

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({ slug: parsed.data.slug, whatsapp_phone: phone, instagram, bot_ask_availability: parsed.data.bot_ask_availability })
    .eq('id', gate.data.studioId)
  if (error) {
    if (error.code === '23505')
      return err('VALIDATION_ERROR', 'Ese link ya está en uso, prueba otro')
    return dbError(error)
  }

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Pantalla 1 — Perfil del estudio: nombre + ubicación + tipo + nº artistas + redes.
 * Un solo botón Guardar en la pantalla → una sola action con todos los campos.
 * Los strings vacíos se guardan como null (no como ''), para no ensuciar el PDF. */
export async function updateStudioProfile(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateStudioProfileSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const d = parsed.data
  const emptyToNull = (v: string | undefined) => (v && v.length > 0 ? v : null)

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({
      name: d.name,
      city: emptyToNull(d.city),
      address: emptyToNull(d.address),
      maps_url: emptyToNull(d.mapsUrl),
      studio_type: d.studioType ?? null,
      artist_count: d.artistCount ?? null,
      instagram: emptyToNull(d.instagram),
      tiktok: emptyToNull(d.tiktok),
      facebook: emptyToNull(d.facebook),
      website: emptyToNull(d.website),
    })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Pantalla 2 — Enlace público (slug). 23505 → mensaje claro (mismo patrón
 * que updateBotSettings). Al cambiar el slug, el link anterior deja de servir. */
export async function updateStudioSlug(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateStudioSlugSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Enlace inválido')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({ slug: parsed.data.slug })
    .eq('id', gate.data.studioId)
  if (error) {
    if (error.code === '23505') return err('VALIDATION_ERROR', 'Ese enlace ya está en uso, prueba otro')
    return dbError(error)
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Pantalla 3 — Horario: días + apertura/cierre. Revalida el calendario
 * porque la ocupación/heatmap usan la jornada real (wiring jornada-real). */
export async function updateStudioSchedule(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateStudioScheduleSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Horario inválido')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({
      open_days: parsed.data.openDays,
      open_time: parsed.data.openTime ?? null,
      close_time: parsed.data.closeTime ?? null,
    })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  return ok(undefined)
}

/** Pantalla 5 — Abono para reservar (default del estudio → wizard de cotización). */
export async function updateStudioDeposit(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateStudioDepositSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Abono inválido')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({
      deposit_mode: parsed.data.depositMode ?? null,
      deposit_value: parsed.data.depositValue ?? null,
    })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Pantalla 6 — Métodos de pago (salen en el PDF como línea condicional). */
export async function updateStudioPaymentMethods(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateStudioPaymentMethodsSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({ payment_methods: parsed.data.methods })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Pantalla 7 — Políticas del estudio (salen en el PDF de la cotización). */
export async function updateStudioPolicies(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateStudioPoliciesSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({
      payment_policy: parsed.data.paymentPolicy ?? null,
      cancellation_policy: parsed.data.cancellationPolicy ?? null,
      studio_rules: parsed.data.rules ?? null,
    })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Pantalla 10 — Perfil de artista: nombre + experiencia (tabla `artists`, vía
 * admin client porque `artists` no tiene write policy RLS) + estilos
 * (`studios.styles`, cliente normal). Escribe `artists` por `user_id`. */
export async function updateArtistProfile(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateArtistProfileSchema.safeParse(input)
  if (!parsed.success)
    return err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('AUTH_ERROR', 'No autenticado')

  // artists → admin (sin policy de escritura para authenticated, ver 00015 RLS)
  const admin = createAdminClient()
  const { error: artistErr } = await admin
    .from('artists')
    .update({
      name: parsed.data.name,
      experience_range: parsed.data.experienceRange ?? null,
      full_time: parsed.data.fullTime ?? null,
      own_studio: parsed.data.ownStudio ?? null,
    })
    .eq('user_id', user.id)
  if (artistErr) return dbError(artistErr)

  // styles → studios (cliente normal, RLS de miembro permite update)
  const { error: studioErr } = await supabase
    .from('studios')
    .update({ styles: parsed.data.styles ?? null })
    .eq('id', gate.data.studioId)
  if (studioErr) return dbError(studioErr)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

export async function uploadStudioLogo(
  formData: FormData
): Promise<Result<{ logoUrl: string }>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0)
    return err('VALIDATION_ERROR', 'Archivo requerido')
  if (!LOGO_ALLOWED_TYPES.includes(file.type as (typeof LOGO_ALLOWED_TYPES)[number]))
    return err('VALIDATION_ERROR', 'Formato no permitido (PNG, JPG, WebP o SVG)')
  if (file.size > LOGO_MAX_BYTES)
    return err('VALIDATION_ERROR', 'El logo supera 2 MB')

  const supabase = await createClient()
  const studioId = gate.data.studioId
  const ext = EXT_BY_TYPE[file.type] ?? 'png'
  const storagePath = `${studioId}/logo.${ext}`

  // Leer el logo previo (puede tener otra extensión) antes de tocar Storage.
  const { data: prev } = await supabase
    .from('studios')
    .select('logo_path')
    .eq('id', studioId)
    .single()

  // Subir el archivo nuevo PRIMERO: si falla, el estudio conserva el logo anterior.
  // Cliente ADMIN (no el de RLS): justo después de crear el estudio en el
  // onboarding, la política de Storage puede evaluarse una fracción de
  // segundo antes de que la fila de `artists` esté visible para ese mismo
  // request — el service role evita depender de ese timing. `requireOwner()`
  // ya validó arriba que este usuario es dueño de `studioId`.
  const admin = createAdminClient()
  const { error: upErr } = await admin.storage
    .from('studio-logos')
    .upload(storagePath, file, { contentType: file.type, upsert: true })
  if (upErr) {
    console.error('[storage]', upErr.message)
    return err('DB_ERROR', 'No se pudo subir el logo. Intenta de nuevo.')
  }

  const { data: { publicUrl } } = admin.storage
    .from('studio-logos')
    .getPublicUrl(storagePath)
  // Cache-busting para que el chrome muestre el logo nuevo tras sobrescribir.
  const logoUrl = `${publicUrl}?v=${Date.now()}`

  // Recién ahora, con la subida confirmada, limpiar el logo previo si tenía otra ruta.
  if (prev?.logo_path && prev.logo_path !== storagePath) {
    await admin.storage.from('studio-logos').remove([prev.logo_path])
  }

  const { error: dbErr } = await supabase
    .from('studios')
    .update({ logo_url: logoUrl, logo_path: storagePath })
    .eq('id', studioId)
  if (dbErr) return dbError(dbErr)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok({ logoUrl })
}

export async function removeStudioLogo(): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const supabase = await createClient()
  const studioId = gate.data.studioId
  const { data: prev } = await supabase
    .from('studios')
    .select('logo_path')
    .eq('id', studioId)
    .single()
  if (prev?.logo_path) {
    await supabase.storage.from('studio-logos').remove([prev.logo_path])
  }

  const { error } = await supabase
    .from('studios')
    .update({ logo_url: null, logo_path: null })
    .eq('id', studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Foto de portada del Home en iPad/escritorio (Ajustes → Perfil del
 * estudio). Mismo patrón exacto que `uploadStudioLogo`/`removeStudioLogo`,
 * solo cambia el bucket y las columnas. Sin límite de 2 MB (foto de fondo,
 * no ícono) — 8 MB, mismos formatos. */
const COVER_MAX_BYTES = 8 * 1024 * 1024

export async function uploadStudioCover(
  formData: FormData
): Promise<Result<{ coverPhotoUrl: string }>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0)
    return err('VALIDATION_ERROR', 'Archivo requerido')
  if (!LOGO_ALLOWED_TYPES.includes(file.type as (typeof LOGO_ALLOWED_TYPES)[number]))
    return err('VALIDATION_ERROR', 'Formato no permitido (PNG, JPG o WebP)')
  if (file.size > COVER_MAX_BYTES)
    return err('VALIDATION_ERROR', 'La foto supera 8 MB')

  const supabase = await createClient()
  const studioId = gate.data.studioId
  const ext = EXT_BY_TYPE[file.type] ?? 'jpg'
  const storagePath = `${studioId}/cover.${ext}`

  const { data: prev } = await supabase
    .from('studios')
    .select('cover_photo_path')
    .eq('id', studioId)
    .single()

  const admin = createAdminClient()
  const { error: upErr } = await admin.storage
    .from('studio-covers')
    .upload(storagePath, file, { contentType: file.type, upsert: true })
  if (upErr) {
    console.error('[storage]', upErr.message)
    return err('DB_ERROR', 'No se pudo subir la foto. Intenta de nuevo.')
  }

  const { data: { publicUrl } } = admin.storage
    .from('studio-covers')
    .getPublicUrl(storagePath)
  const coverPhotoUrl = `${publicUrl}?v=${Date.now()}`

  if (prev?.cover_photo_path && prev.cover_photo_path !== storagePath) {
    await admin.storage.from('studio-covers').remove([prev.cover_photo_path])
  }

  const { error: dbErr } = await supabase
    .from('studios')
    .update({ cover_photo_url: coverPhotoUrl, cover_photo_path: storagePath })
    .eq('id', studioId)
  if (dbErr) return dbError(dbErr)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok({ coverPhotoUrl })
}

export async function removeStudioCover(): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate

  const supabase = await createClient()
  const studioId = gate.data.studioId
  const { data: prev } = await supabase
    .from('studios')
    .select('cover_photo_path')
    .eq('id', studioId)
    .single()
  if (prev?.cover_photo_path) {
    await supabase.storage.from('studio-covers').remove([prev.cover_photo_path])
  }

  const { error } = await supabase
    .from('studios')
    .update({ cover_photo_url: null, cover_photo_path: null })
    .eq('id', studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return ok(undefined)
}

/** Precios preestablecidos para la Cotización rápida (Ajustes → Precios). */
export async function updatePricePresetsAction(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updatePricePresetsSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({ price_presets: parsed.data.presets })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/quotes/quick')
  return ok(undefined)
}

/** Cada cuántos minutos se dividen las franjas del calendario (Ajustes). */
export async function updateSlotIntervalAction(input: unknown): Promise<Result<void>> {
  const gate = await requireOwner()
  if (!gate.success) return gate
  const parsed = updateSlotIntervalSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Debe ser 15, 30 o 60 minutos')

  const supabase = await createClient()
  const { error } = await supabase
    .from('studios')
    .update({ slot_interval_minutes: parsed.data.minutes })
    .eq('id', gate.data.studioId)
  if (error) return dbError(error)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  revalidatePath('/dashboard/quotes/quick')
  return ok(undefined)
}
