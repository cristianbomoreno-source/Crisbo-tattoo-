import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import { buildQuoteTemplateData, type QuoteTemplateData, type QuoteTemplateStudio } from '@/lib/pdf/quote-template-data'
import type { QuoteWithClient } from '@/queries/quotes'

export type QuoteLandingData = {
  token: string
  expiresAt: string
  quote: QuoteTemplateData
  artistName: string
  experienceRange: string | null
  fullTime: boolean | null
  /** true si la cotización ya se convirtió en proyecto (existe una fila en
   * `projects` con `quote_id` = esta cotización) — cambia el estado visual
   * de la landing (hero + badge), independiente de si ya tiene sesión. */
  isProject: boolean
  /** Próxima sesión agendada del proyecto (si la cotización ya se convirtió
   * en proyecto y tiene una sesión futura) — para el botón "Agregar a mi
   * calendario" en la landing. `null` si no hay ninguna. */
  nextSession: { scheduledAt: string; durationMinutes: number } | null
}

type QuoteLinkRow = QuoteWithClient & {
  artists: { name: string; experience_range: string | null; full_time: boolean | null } | null
  studios:
    | {
        name: string
        logo_url: string | null
        quote_template_color: string | null
        whatsapp_phone: string | null
        instagram: string | null
        tiktok: string | null
        facebook: string | null
        website: string | null
        payment_policy: string | null
        cancellation_policy: string | null
        payment_methods: string[] | null
        studio_rules: string[] | null
        quote_letter_message: string | null
        quote_price_negotiable: boolean
        quote_confirm_template: string
      }
    | null
}

/** Público (service-role): datos de la landing de un proyecto por token de
 * cotización. Reutiliza `buildQuoteTemplateData` — la misma fuente de datos
 * que ya alimenta la imagen de WhatsApp; nada se calcula dos veces. */
export async function getPublicQuoteProject(token: string): Promise<Result<QuoteLandingData>> {
  const admin = createAdminClient()
  const { data: link, error: linkError } = await admin
    .from('quote_links')
    .select('quote_id, expires_at')
    .eq('token', token)
    .maybeSingle()
  if (linkError) return err('DB_ERROR', linkError.message)
  if (!link) return err('NOT_FOUND', 'Enlace no encontrado')
  if (new Date(link.expires_at).getTime() < Date.now()) return err('VALIDATION_ERROR', 'Este enlace expiró')

  const { data: row, error: quoteError } = await admin
    .from('quotes')
    .select(
      '*, clients(name, phone, email), artists(name, experience_range, full_time), studios(name, logo_url, quote_template_color, whatsapp_phone, instagram, tiktok, facebook, website, payment_policy, cancellation_policy, payment_methods, studio_rules, quote_letter_message, quote_price_negotiable, quote_confirm_template)'
    )
    .eq('id', link.quote_id)
    .maybeSingle()
  if (quoteError) return err('DB_ERROR', quoteError.message)
  if (!row) return err('NOT_FOUND', 'Proyecto no encontrado')

  const { artists, studios, ...quote } = row as unknown as QuoteLinkRow

  const publicUrl = (path: string) => admin.storage.from('quote-photos').getPublicUrl(path).data.publicUrl
  const photoUrl = quote.reference_photo_path ? publicUrl(quote.reference_photo_path) : null
  const referencePhotos = [quote.reference_photo_path, ...(quote.extra_photo_paths ?? [])]
    .filter((p): p is string => Boolean(p))
    .map(publicUrl)

  const studio: QuoteTemplateStudio | null = studios
    ? {
        name: studios.name,
        logoUrl: studios.logo_url,
        quoteTemplateColor: studios.quote_template_color,
        whatsappPhone: studios.whatsapp_phone,
        instagram: studios.instagram,
        tiktok: studios.tiktok,
        facebook: studios.facebook,
        website: studios.website,
        paymentPolicy: studios.payment_policy,
        cancellationPolicy: studios.cancellation_policy,
        studioRules: studios.studio_rules,
        paymentMethods: studios.payment_methods,
        quoteLetterMessage: studios.quote_letter_message,
        quotePriceNegotiable: studios.quote_price_negotiable,
        quoteConfirmTemplate: studios.quote_confirm_template,
      }
    : null

  // Próxima sesión agendada (si la cotización ya es un proyecto con sesión futura).
  let nextSession: { scheduledAt: string; durationMinutes: number } | null = null
  const { data: project } = await admin
    .from('projects')
    .select('id')
    .eq('quote_id', quote.id)
    .maybeSingle()
  if (project) {
    const { data: session } = await admin
      .from('sessions')
      .select('scheduled_at, duration_minutes')
      .eq('project_id', project.id)
      .neq('status', 'cancelled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (session) nextSession = { scheduledAt: session.scheduled_at, durationMinutes: session.duration_minutes }
  }

  return ok({
    token,
    expiresAt: link.expires_at,
    quote: buildQuoteTemplateData(quote, studio, photoUrl, referencePhotos),
    artistName: artists?.name ?? studios?.name ?? 'Tu tatuador',
    experienceRange: artists?.experience_range ?? null,
    fullTime: artists?.full_time ?? null,
    isProject: Boolean(project),
    nextSession,
  })
}
