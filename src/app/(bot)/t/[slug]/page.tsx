import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { IntakeChat } from '@/components/intake/intake-chat'

const WEEKDAY_LABELS: Record<string, string> = {
  LUN: 'Lunes', MAR: 'Martes', MIE: 'Miércoles', JUE: 'Jueves', VIE: 'Viernes', SAB: 'Sábado', DOM: 'Domingo',
}
const WEEKDAY_ORDER = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'] as const

/** Días de la semana habilitados en el horario del estudio (Ajustes →
 * Horario, `open_days` ya guarda 'LUN'..'DOM'), como opciones simples para
 * la pregunta "¿qué día se acomoda mejor?" — ya no son 8 fechas puntuales
 * calculadas a futuro, sino una preferencia general de día de la semana
 * (el estudio coordina la fecha exacta después). Sin `open_days`
 * configurado, se ofrecen los 7 días. */
function weekdayOptions(openDays: string[] | null): { key: string; label: string }[] {
  const enabled = openDays && openDays.length > 0 ? openDays : WEEKDAY_ORDER
  return WEEKDAY_ORDER.filter(d => enabled.includes(d)).map(d => ({ key: d, label: WEEKDAY_LABELS[d]! }))
}

export default async function IntakePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: studio } = await admin
    .from('studios')
    .select('id, slug, name, logo_url, whatsapp_phone, instagram, open_days, bot_ask_availability')
    .eq('slug', slug)
    .single()
  if (!studio) notFound()

  const availableDays = weekdayOptions(studio.open_days)

  return (
    <IntakeChat
      slug={studio.slug}
      studioName={studio.name}
      logoUrl={studio.logo_url}
      waPhone={studio.whatsapp_phone}
      instagram={studio.instagram}
      availableDays={availableDays}
      askAvailability={studio.bot_ask_availability}
    />
  )
}
