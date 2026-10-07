'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, err, type Result } from '@/lib/errors/types'
import {
  intakeSchema,
  INTAKE_MAX_PHOTOS,
  INTAKE_PHOTO_MAX_BYTES,
  INTAKE_PHOTO_TYPES,
} from '@/lib/validations/intake'
import { normalizePhone } from '@/lib/intake/phone'
import { RateLimiter } from '@/lib/intake/rate-limit'
import { buildIntakeMessage } from '@/lib/intake/message'
import { buildNameMismatchNote } from '@/lib/intake/name-note'
import { waLink } from '@/lib/whatsapp'
import { sendPushToStudio } from '@/lib/push/send'

// 5 solicitudes por IP por hora (en memoria: por instancia serverless, suficiente v1).
const limiter = new RateLimiter(5, 60 * 60 * 1000)

const GENERIC_ERROR = 'No pudimos enviar tu solicitud. Intenta de nuevo.'

/**
 * Busca si ya existe un cliente con este teléfono en el estudio — se llama
 * apenas el usuario escribe su WhatsApp (primer paso del bot), para saltar
 * las preguntas de nombre/email si ya las tenemos. Nunca crea ni modifica
 * nada; solo lectura. No expone más que nombre/email (lo mínimo para
 * precargar el bot), y solo dentro del mismo estudio al que le están
 * escribiendo — no busca en otros estudios.
 */
export async function lookupClientByPhoneForBot(
  slug: string,
  rawPhone: string
): Promise<Result<{ name: string; email: string | null; birthdate: string | null } | null>> {
  const phone = normalizePhone(rawPhone)
  if (!phone) return err('VALIDATION_ERROR', 'Teléfono inválido')

  const admin = createAdminClient()
  const { data: studio } = await admin.from('studios').select('id').eq('slug', slug).single()
  if (!studio) return err('NOT_FOUND', 'Estudio no encontrado')

  const { data: client } = await admin
    .from('clients')
    .select('name, email, birthdate')
    .eq('studio_id', studio.id)
    .eq('phone', phone)
    .maybeSingle()

  return ok(client ? { name: client.name, email: client.email, birthdate: client.birthdate } : null)
}

export async function submitIntakeAction(
  formData: FormData
): Promise<Result<{ waLink: string }>> {
  const raw = Object.fromEntries(formData.entries())
  // service/style son opcionales en el schema: '' (no respondido) debe volverse
  // undefined, porque z.enum(...).optional() rechaza el string vacío.
  if (raw.service === '') delete raw.service
  if (raw.style === '') delete raw.style
  const parsed = intakeSchema.safeParse(raw)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? 'local').split(',')[0]?.trim() ?? 'local'
  if (!limiter.allow(ip))
    return err('FORBIDDEN', 'Demasiados envíos desde esta conexión. Intenta más tarde.')

  const phone = normalizePhone(parsed.data.phone)
  if (!phone) return err('VALIDATION_ERROR', 'Teléfono inválido')

  const admin = createAdminClient()

  const { data: studio } = await admin
    .from('studios')
    .select('id, name, whatsapp_phone, bot_contact_template')
    .eq('slug', parsed.data.slug)
    .single()
  if (!studio?.whatsapp_phone)
    return err('NOT_FOUND', 'Este estudio no está recibiendo solicitudes por aquí.')

  // Artista destino: el dueño; si no hay, el más antiguo.
  const { data: artists } = await admin
    .from('artists')
    .select('id, role')
    .eq('studio_id', studio.id)
    .order('created_at', { ascending: true })
  const artist = artists?.find(a => a.role === 'owner') ?? artists?.[0]
  if (!artist) return err('NOT_FOUND', 'Este estudio no está recibiendo solicitudes por aquí.')

  // Cliente: vincular por teléfono normalizado; si existe NO se sobreescriben sus datos.
  const { data: existing } = await admin
    .from('clients')
    .select('id, name, birthdate')
    .eq('studio_id', studio.id)
    .eq('phone', phone)
    .maybeSingle()

  // Si el cliente ya existía con otro nombre, no lo renombramos, pero sí
  // avisamos al tatuador anotándolo en la cotización.
  const nameMismatchNote = existing
    ? buildNameMismatchNote(existing.name, parsed.data.name)
    : null

  let clientId = existing?.id
  if (!clientId) {
    const { data: created, error: clientErr } = await admin
      .from('clients')
      .insert({
        studio_id: studio.id,
        name: parsed.data.name,
        phone,
        email: parsed.data.email,
        birthdate: parsed.data.birthdate || null,
      })
      .select('id')
      .single()
    if (clientErr || !created) return err('DB_ERROR', GENERIC_ERROR)
    clientId = created.id
  } else if (existing && !existing.birthdate && parsed.data.birthdate) {
    // El bot solo pregunta la fecha de nacimiento si no la teníamos — si
    // llegó un valor nuevo para un cliente que aún no la tenía, la guardamos
    // para no volver a pedirla la próxima vez.
    await admin.from('clients').update({ birthdate: parsed.data.birthdate }).eq('id', clientId)
  }

  const { data: quote, error: quoteErr } = await admin
    .from('quotes')
    .insert({
      studio_id: studio.id,
      artist_id: artist.id,
      client_id: clientId,
      status: 'new',
      source: 'bot',
      gender: parsed.data.gender,
      age: parsed.data.age,
      service: parsed.data.service ?? null,
      style: parsed.data.style ?? null,
      body_zone: parsed.data.body_zone,
      size: parsed.data.size,
      color: parsed.data.color,
      skin_tone: parsed.data.skin_tone,
      availability: parsed.data.availability,
      description: parsed.data.description,
      notes: nameMismatchNote,
    })
    .select('id')
    .single()
  if (quoteErr || !quote) return err('DB_ERROR', GENERIC_ERROR)

  const notifTitle = 'Nueva cotización por el bot'
  const notifBody = `${parsed.data.name} envió una solicitud${parsed.data.style ? ` de ${parsed.data.style}` : ''}.`
  const notifLink = `/dashboard/quotes/${quote.id}`

  await admin.from('notifications').insert({
    studio_id: studio.id,
    title: notifTitle,
    body: notifBody,
    link: notifLink,
  })

  // Push nativo (aparte de la campana in-app de arriba): llega aunque la
  // app esté cerrada. Nunca tumba el flujo si falla o si no hay llaves
  // VAPID configuradas — ver `sendPushToStudio`.
  await sendPushToStudio(studio.id, { title: notifTitle, body: notifBody, link: notifLink })

  // Fotos: 1.ª → reference_photo_path, 2.ª y 3.ª → extra_photo_paths.
  // Un fallo de subida no tumba la solicitud ya creada.
  const photos = formData
    .getAll('photos')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, INTAKE_MAX_PHOTOS)

  const uploaded: string[] = []
  for (const [i, file] of photos.entries()) {
    if (file.size > INTAKE_PHOTO_MAX_BYTES) continue
    if (!INTAKE_PHOTO_TYPES.includes(file.type as (typeof INTAKE_PHOTO_TYPES)[number]))
      continue
    const path = `${studio.id}/${quote.id}/bot-${i + 1}`
    const { error: upErr } = await admin.storage
      .from('quote-photos')
      .upload(path, file, { contentType: file.type, upsert: true })
    if (!upErr) uploaded.push(path)
  }
  if (uploaded.length > 0) {
    await admin
      .from('quotes')
      .update({
        reference_photo_path: uploaded[0],
        extra_photo_paths: uploaded.slice(1),
      })
      .eq('id', quote.id)
  }

  const message = buildIntakeMessage(studio.name, parsed.data, uploaded.length, studio.bot_contact_template)
  const link = waLink(studio.whatsapp_phone, message)
  if (!link) return err('DB_ERROR', GENERIC_ERROR)
  return ok({ waLink: link })
}
