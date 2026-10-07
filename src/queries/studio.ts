import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type CurrentStudio = {
  id: string
  /** Id de la fila `artists` del usuario actual (para `work_shifts`, jornada del Home en iPad/escritorio). */
  artistId: string
  name: string
  slug: string
  logoUrl: string | null
  /** Foto de portada del Home en iPad/escritorio (Ajustes → Perfil del estudio). `null` = fondo oscuro por defecto. */
  coverPhotoUrl: string | null
  role: string
  quoteMessageTemplate: string
  /** Plantillas de WhatsApp (Ajustes → Personalización → Plantillas de WhatsApp). */
  reminderBalanceTemplate: string
  reminderSessionTemplate: string
  contactClientTemplate: string
  /** Mensaje del bot al cliente → estudio al terminar la solicitud (Ajustes → Personalización → Plantillas de WhatsApp). */
  botContactTemplate: string
  /** Mensaje de "Reservar mi proyecto" / "¿Tienes dudas?" en la landing pública de una cotización. */
  quoteConfirmTemplate: string
  /** Confirmación de cita agendada — botón "Confirmar cita" al tocar una cita
   * en el calendario, y mensaje automático al crear una cita nueva. */
  bookingConfirmationTemplate: string
  whatsappPhone: string | null
  instagram: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  artistName: string | null
  onboardingStepsDone: string[]
  openDays: string[] | null
  openTime: string | null
  closeTime: string | null
  botAskAvailability: boolean
  depositMode: string | null
  depositValue: number | null
  paymentPolicy: string | null
  cancellationPolicy: string | null
  studioRules: string[] | null
  city: string | null
  address: string | null
  mapsUrl: string | null
  studioType: string | null
  artistCount: string | null
  paymentMethods: string[] | null
  styles: string[] | null
  pricePresets: { label: string; amount: number }[]
  slotIntervalMinutes: number
  experienceRange: string | null
  fullTime: boolean | null
  ownStudio: boolean | null
  /** Color de acento de la plantilla de cotización (Ajustes → Personalización). 'green' por defecto. */
  quoteTemplateColor: string | null
  /** Carta del tatuador en la landing del proyecto (`quote-message.tsx`). `null` = usa la plantilla por defecto. */
  quoteLetterMessage: string | null
  /** Si el tatuador permite que el cliente proponga otro valor desde la landing del proyecto. */
  quotePriceNegotiable: boolean
  /** Metas mensuales (Ajustes → Estudio → Metas). `null` = sin meta definida para ese indicador. */
  monthlyGoalQuotedValue: number | null
  monthlyGoalApprovedProjects: number | null
  monthlyGoalScheduledSessions: number | null
  /** Código de invitación del estudio (Ajustes → Equipo, `OFK-XXXXXX`). */
  joinCode: string
  /** Tope de tatuadores activos (20 por defecto). */
  maxArtists: number
  /** 'estudio' si se creó desde el flujo "Tengo un estudio" (Pantalla 0),
   * 'tatuador' si se creó desde el registro de tatuador (independiente o
   * unido a otro estudio). Solo cambia la etiqueta en Ajustes. */
  accountKind: 'tatuador' | 'estudio'
}

/**
 * Marca + rol del estudio del usuario actual. `null` si no hay sesión/estudio.
 * RLS limita la fila de `artists` al usuario; el estudio embebido es el suyo.
 *
 * Envuelto en React.cache(): el layout del dashboard Y cada página lo llaman
 * en el mismo request — sin dedupe eran DOS round-trips a Supabase por cada
 * navegación. Con cache() la segunda llamada reutiliza el resultado.
 */
export const getCurrentStudio = cache(async (): Promise<CurrentStudio | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select(
      'id, name, role, experience_range, full_time, own_studio, studio:studios(id, name, slug, logo_url, cover_photo_url, whatsapp_phone, quote_message_template, reminder_balance_template, reminder_session_template, contact_client_template, bot_contact_template, quote_confirm_template, booking_confirmation_template, instagram, tiktok, facebook, website, onboarding_steps_done, open_days, open_time, close_time, bot_ask_availability, deposit_mode, deposit_value, payment_policy, cancellation_policy, studio_rules, city, address, studio_type, artist_count, payment_methods, styles, price_presets, slot_interval_minutes, quote_template_color, quote_letter_message, quote_price_negotiable, monthly_goal_quoted_value, monthly_goal_approved_projects, monthly_goal_scheduled_sessions, join_code, max_artists, account_kind, maps_url)'
    )
    .single()

  if (!data?.studio) return null
  const studio = data.studio as unknown as {
    id: string
    name: string
    slug: string
    logo_url: string | null
    cover_photo_url: string | null
    whatsapp_phone: string | null
    quote_message_template: string
    reminder_balance_template: string
    reminder_session_template: string
    contact_client_template: string
    bot_contact_template: string
    quote_confirm_template: string
    booking_confirmation_template: string
    instagram: string | null
    tiktok: string | null
    facebook: string | null
    website: string | null
    onboarding_steps_done: string[] | null
    open_days: string[] | null
    open_time: string | null
    close_time: string | null
    bot_ask_availability: boolean
    deposit_mode: string | null
    deposit_value: number | null
    payment_policy: string | null
    cancellation_policy: string | null
    studio_rules: string[] | null
    city: string | null
    address: string | null
    maps_url: string | null
    studio_type: string | null
    artist_count: string | null
    payment_methods: string[] | null
    styles: string[] | null
    price_presets: { label: string; amount: number }[] | null
    slot_interval_minutes: number | null
    quote_template_color: string | null
    quote_letter_message: string | null
    quote_price_negotiable: boolean
    monthly_goal_quoted_value: number | null
    monthly_goal_approved_projects: number | null
    monthly_goal_scheduled_sessions: number | null
    join_code: string
    max_artists: number
    account_kind: string
  }
  return {
    id: studio.id,
    artistId: data.id as string,
    name: studio.name,
    slug: studio.slug,
    logoUrl: studio.logo_url,
    coverPhotoUrl: studio.cover_photo_url,
    role: data.role as string,
    quoteMessageTemplate: studio.quote_message_template,
    reminderBalanceTemplate: studio.reminder_balance_template,
    reminderSessionTemplate: studio.reminder_session_template,
    contactClientTemplate: studio.contact_client_template,
    botContactTemplate: studio.bot_contact_template,
    quoteConfirmTemplate: studio.quote_confirm_template,
    bookingConfirmationTemplate: studio.booking_confirmation_template,
    whatsappPhone: studio.whatsapp_phone,
    instagram: studio.instagram,
    tiktok: studio.tiktok,
    facebook: studio.facebook,
    website: studio.website,
    artistName: (data.name as string | null) ?? null,
    onboardingStepsDone: studio.onboarding_steps_done ?? [],
    openDays: studio.open_days,
    openTime: studio.open_time,
    closeTime: studio.close_time,
    botAskAvailability: studio.bot_ask_availability,
    depositMode: studio.deposit_mode,
    depositValue: studio.deposit_value,
    paymentPolicy: studio.payment_policy,
    cancellationPolicy: studio.cancellation_policy,
    studioRules: studio.studio_rules,
    city: studio.city,
    address: studio.address,
    mapsUrl: studio.maps_url,
    studioType: studio.studio_type,
    artistCount: studio.artist_count,
    paymentMethods: studio.payment_methods,
    styles: studio.styles,
    pricePresets: studio.price_presets ?? [],
    slotIntervalMinutes: studio.slot_interval_minutes ?? 30,
    experienceRange: (data.experience_range as string | null) ?? null,
    fullTime: (data.full_time as boolean | null) ?? null,
    ownStudio: (data.own_studio as boolean | null) ?? null,
    quoteTemplateColor: studio.quote_template_color,
    quoteLetterMessage: studio.quote_letter_message,
    quotePriceNegotiable: studio.quote_price_negotiable ?? false,
    monthlyGoalQuotedValue: studio.monthly_goal_quoted_value,
    monthlyGoalApprovedProjects: studio.monthly_goal_approved_projects,
    monthlyGoalScheduledSessions: studio.monthly_goal_scheduled_sessions,
    joinCode: studio.join_code,
    maxArtists: studio.max_artists ?? 20,
    accountKind: studio.account_kind === 'estudio' ? 'estudio' : 'tatuador',
  }
})
