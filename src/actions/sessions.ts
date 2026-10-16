'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import {
  createSessionSchema,
  rescheduleSessionSchema,
  bulkSessionsSchema,
} from '@/lib/validations/sessions'
import { revalidatePath } from 'next/cache'
import { ownsRow } from '@/lib/authz'
import { findSessionConflict, findBlockedDay, isWeekdayClosed } from '@/lib/sessions/availability'
import { blockDaySchema } from '@/lib/validations/blocked-days'
import type { Session, SessionStatus } from '@/queries/sessions'
import { getCurrentPermissions } from '@/queries/permissions'
import { getCurrentStudio } from '@/queries/studio'
import { waLink } from '@/lib/whatsapp'
import { buildMessage } from '@/lib/quotes/message'
import { DEFAULT_BOOKING_CONFIRMATION_TEMPLATE } from '@/lib/messages/templates'

function conflictMessage(conflict: { projectName: string | null; clientName: string | null }) {
  const detail = conflict.projectName
    ? ` (${conflict.projectName}${conflict.clientName ? ` — ${conflict.clientName}` : ''})`
    : ''
  return `Ese horario choca con otra cita${detail}. Elige otro horario.`
}

async function getArtistAndStudio() {
  const supabase = await createClient()
  const { data } = await supabase.from('artists').select('id, studio_id').single()
  return data
}

export async function createSessionAction(input: unknown): Promise<Result<Session>> {
  const parsed = createSessionSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_create_appointments)
    return err('FORBIDDEN', 'No tienes permiso para crear citas')

  if (!(await ownsRow('projects', parsed.data.project_id)))
    return err('NOT_FOUND', 'Proyecto no encontrado')

  if (await findBlockedDay(artist.studio_id, parsed.data.scheduled_at))
    return err('VALIDATION_ERROR', 'Ese día está bloqueado en el calendario. Elige otra fecha.')

  if (await isWeekdayClosed(artist.studio_id, parsed.data.scheduled_at))
    return err('VALIDATION_ERROR', 'Ese día de la semana no está configurado como día de atención (Ajustes → Horario). Elige otra fecha.')

  const conflict = await findSessionConflict({
    studioId: artist.studio_id,
    scheduledAt: parsed.data.scheduled_at,
    durationMinutes: parsed.data.duration_minutes,
  })
  if (conflict) return err('VALIDATION_ERROR', conflictMessage(conflict))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      ...parsed.data,
      studio_id: artist.studio_id,
      artist_id: artist.id,
    })
    .select()
    .single()

  if (error) return dbError(error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  revalidatePath(`/dashboard/projects/${parsed.data.project_id}`)
  return ok(data as Session)
}

export async function updateSessionStatusAction(
  id: string,
  status: SessionStatus
): Promise<Result<Session>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError(error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  revalidatePath('/dashboard/projects')
  if (data?.project_id) revalidatePath(`/dashboard/projects/${data.project_id}`)
  return ok(data as Session)
}

export async function createSessionsBulkAction(
  projectId: string,
  input: unknown
): Promise<Result<{ id: string; scheduled_at: string }[]>> {
  const parsed = bulkSessionsSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  // Validar cada sesión contra días bloqueados y choques con citas existentes
  // (mismo estudio) — igual que createSessionAction. Antes el alta en lote no
  // validaba nada, así que desde el proyecto se podía duplicar horario.
  for (const s of parsed.data.sessions) {
    if (await findBlockedDay(artist.studio_id, s.scheduled_at))
      return err('VALIDATION_ERROR', 'Uno de los días está bloqueado en el calendario. Elige otra fecha.')

    if (await isWeekdayClosed(artist.studio_id, s.scheduled_at))
      return err('VALIDATION_ERROR', 'Uno de los días elegidos no está configurado como día de atención (Ajustes → Horario). Elige otra fecha.')

    const conflict = await findSessionConflict({
      studioId: artist.studio_id,
      scheduledAt: s.scheduled_at,
      durationMinutes: s.duration_minutes,
    })
    if (conflict) return err('VALIDATION_ERROR', conflictMessage(conflict))
  }

  // Choques entre las propias filas del lote.
  const sorted = [...parsed.data.sessions].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (!prev || !curr) continue
    const prevEnd = new Date(prev.scheduled_at).getTime() + prev.duration_minutes * 60_000
    if (new Date(curr.scheduled_at).getTime() < prevEnd)
      return err('VALIDATION_ERROR', 'Dos de las sesiones que agregaste se solapan entre sí. Ajusta los horarios.')
  }

  const supabase = await createClient()
  const rows = parsed.data.sessions.map((s) => ({
    project_id: projectId,
    studio_id: artist.studio_id,
    artist_id: artist.id,
    scheduled_at: s.scheduled_at,
    duration_minutes: s.duration_minutes,
  }))
  const { data, error } = await supabase.from('sessions').insert(rows).select('id, scheduled_at')
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  revalidatePath(`/dashboard/projects/${projectId}`)
  return ok((data ?? []) as { id: string; scheduled_at: string }[])
}

export async function rescheduleSessionAction(
  id: string,
  input: unknown,
  projectId?: string
): Promise<Result<Session>> {
  const parsed = rescheduleSessionSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_move_appointments)
    return err('FORBIDDEN', 'No tienes permiso para mover citas')

  if (await findBlockedDay(artist.studio_id, parsed.data.scheduled_at))
    return err('VALIDATION_ERROR', 'Ese día está bloqueado en el calendario. Elige otra fecha.')

  if (await isWeekdayClosed(artist.studio_id, parsed.data.scheduled_at))
    return err('VALIDATION_ERROR', 'Ese día de la semana no está configurado como día de atención (Ajustes → Horario). Elige otra fecha.')

  const conflict = await findSessionConflict({
    studioId: artist.studio_id,
    scheduledAt: parsed.data.scheduled_at,
    durationMinutes: parsed.data.duration_minutes,
    excludeSessionId: id,
  })
  if (conflict) return err('VALIDATION_ERROR', conflictMessage(conflict))

  const supabase = await createClient()
  const { data: before } = await supabase.from('sessions').select('scheduled_at').eq('id', id).maybeSingle()
  // Otra hora → el recordatorio de WhatsApp vuelve a salir con la hora nueva
  // y la cita queda otra vez por confirmar.
  const moved = !before || before.scheduled_at.slice(0, 16) !== parsed.data.scheduled_at.slice(0, 16)
  const { data, error } = await supabase
    .from('sessions')
    .update({
      scheduled_at: parsed.data.scheduled_at,
      duration_minutes: parsed.data.duration_minutes,
      status: 'rescheduled',
      ...(moved
        ? { reminder_sent_at: null, confirmation: null, confirmation_at: null, confirmation_followup_at: null }
        : {}),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError(error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  if (projectId) revalidatePath(`/dashboard/projects/${projectId}`)
  return ok(data as Session)
}

export async function deleteSessionAction(id: string): Promise<Result<void>> {
  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_cancel_sessions)
    return err('FORBIDDEN', 'No tienes permiso para cancelar sesiones')

  const supabase = await createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) return dbError(error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  return ok(undefined)
}

export async function blockDayAction(input: unknown): Promise<Result<void>> {
  const parsed = blockDaySchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_block_schedule)
    return err('FORBIDDEN', 'No tienes permiso para bloquear horarios')

  const supabase = await createClient()
  const dayStart = `${parsed.data.date}T00:00:00.000Z`
  const dayEnd = `${parsed.data.date}T23:59:59.999Z`
  const { data: existing } = await supabase
    .from('sessions')
    .select('id, projects(name)')
    .eq('studio_id', artist.studio_id)
    .neq('status', 'cancelled')
    .gte('scheduled_at', dayStart)
    .lte('scheduled_at', dayEnd)

  if (existing && existing.length > 0) {
    const names = (existing as unknown as { projects: { name: string } | null }[])
      .map((s) => s.projects?.name ?? 'Sesión')
      .join(', ')
    return err(
      'VALIDATION_ERROR',
      `No puedes bloquear este día: ya tienes citas agendadas (${names}). Reprográmalas primero.`
    )
  }

  const { error } = await supabase
    .from('blocked_days')
    .insert({ studio_id: artist.studio_id, date: parsed.data.date, reason: parsed.data.reason })
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  return ok(undefined)
}

export async function unblockDayAction(date: string): Promise<Result<void>> {
  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('blocked_days')
    .delete()
    .eq('studio_id', artist.studio_id)
    .eq('date', date)
  if (error) return dbError(error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  return ok(undefined)
}

/** "domingo 27 de julio" -- misma convención de hora-de-pared en UTC que
 * `formatTime` en `lib/calendar/utils.ts` (evita que un desfase de
 * zona horaria corra la fecha un día). */
function formatBookingDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
}

function formatBookingTime(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/**
 * Arma el link de wa.me para confirmar una cita (fecha, hora, lugar y
 * tatuador) usando la plantilla "Confirmación de cita agendada" (Ajustes →
 * Personalización → Plantillas de WhatsApp). La usan: el botón "Confirmar
 * cita" al tocar una cita en el calendario, y el aviso automático que se
 * abre justo después de crear una cita nueva -- desde el calendario, una
 * cotización o un proyecto, un mismo lugar para no triplicar esta lógica.
 * `link: null` si el cliente no tiene teléfono guardado (no es un error,
 * mismo criterio que el resto de botones de WhatsApp de la app).
 */
export async function getBookingConfirmationLinkAction(
  sessionId: string
): Promise<Result<{ link: string | null }>> {
  const res = await buildBookingConfirmation(sessionId)
  if (!res.success) return res
  return ok({ link: waLink(res.data.phone, res.data.message) })
}

/** Texto de confirmación de la cita (plantilla del estudio) + teléfono del
 * cliente. Lo usan el link wa.me de arriba y el envío por la API desde la
 * bandeja de Mensajes (`sendBookingConfirmationToChat`). */
export async function buildBookingConfirmation(
  sessionId: string
): Promise<Result<{ message: string; phone: string | null }>> {
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select(
      'scheduled_at, artist_id, projects(clients(name, phone)), artists(name), studios(name, address, city, booking_confirmation_template)'
    )
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return err('NOT_FOUND', 'Cita no encontrada')

  const row = session as unknown as {
    scheduled_at: string
    projects: { clients: { name: string; phone: string | null } | null } | null
    artists: { name: string } | null
    studios: {
      name: string
      address: string | null
      city: string | null
      booking_confirmation_template: string
    } | null
  }

  const client = row.projects?.clients ?? null
  const studio = row.studios
  const place = studio?.address || studio?.city || studio?.name || 'nuestro estudio'

  const message = buildMessage(studio?.booking_confirmation_template || DEFAULT_BOOKING_CONFIRMATION_TEMPLATE, {
    nombre_cliente: client?.name ?? '',
    fecha: formatBookingDate(row.scheduled_at),
    hora: formatBookingTime(row.scheduled_at),
    lugar: place,
    nombre_tatuador: row.artists?.name ?? '',
  })

  return ok({ message, phone: client?.phone ?? null })
}

export type SessionPopupInfo = {
  /** Foto más reciente del proyecto (encabezado del popup), o null. */
  coverUrl: string | null
  totalValue: number
  paid: number
  payments: { id: string; amount: number; paid_at: string; payment_method: string | null }[]
  paymentMethods: string[] | null
}

/** Datos extra del popup de una cita: foto del proyecto y pagos. */
export async function getSessionPopupInfoAction(projectId: string): Promise<Result<SessionPopupInfo>> {
  const studio = await getCurrentStudio()
  if (!studio) return err('AUTH_ERROR', 'No autenticado')
  const supabase = await createClient()
  const [{ data: project, error }, { data: photos }] = await Promise.all([
    supabase
      .from('projects')
      .select('total_value, payments(id, amount, paid_at, payment_method)')
      .eq('id', projectId)
      .maybeSingle(),
    supabase
      .from('gallery')
      .select('url')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1),
  ])
  if (error) return dbError(error)
  if (!project) return err('NOT_FOUND', 'Proyecto no encontrado')
  const payments = ((project.payments ?? []) as SessionPopupInfo['payments']).sort((a, b) =>
    b.paid_at.localeCompare(a.paid_at)
  )
  return ok({
    coverUrl: (photos?.[0]?.url as string | undefined) ?? null,
    totalValue: (project.total_value as number | null) ?? 0,
    paid: payments.reduce((s, p) => s + (p.amount ?? 0), 0),
    payments,
    paymentMethods: studio.paymentMethods,
  })
}

/** Cambia a mano el estado de confirmación de una cita (botón de estado en
 * Inicio y en el popup de la cita). Cancelada también cancela la cita
 * (libera el espacio); volver a confirmada/por confirmar la reactiva. No
 * envía mensajes al cliente. */
export async function setSessionConfirmationAction(
  id: string,
  confirmation: 'pending' | 'confirmed' | 'cancelled'
): Promise<Result<void>> {
  if (!['pending', 'confirmed', 'cancelled'].includes(confirmation))
    return err('VALIDATION_ERROR', 'Estado inválido')
  const gate = await getCurrentPermissions()
  if (confirmation === 'cancelled' && gate && !gate.permissions.can_cancel_sessions)
    return err('FORBIDDEN', 'No tienes permiso para cancelar sesiones')

  const supabase = await createClient()
  const { data: current, error: readErr } = await supabase
    .from('sessions')
    .select('status, project_id')
    .eq('id', id)
    .maybeSingle()
  if (readErr) return dbError(readErr)
  if (!current) return err('NOT_FOUND', 'Cita no encontrada')
  if (current.status === 'completed') return err('VALIDATION_ERROR', 'Esta cita ya se realizó')

  const update: Record<string, unknown> = { confirmation, confirmation_at: new Date().toISOString() }
  if (confirmation === 'cancelled') update.status = 'cancelled'
  else if (current.status === 'cancelled') update.status = 'scheduled'

  const { error } = await supabase.from('sessions').update(update).eq('id', id)
  if (error) return dbError(error)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  if (current.project_id) revalidatePath(`/dashboard/projects/${current.project_id}`)
  return ok(undefined)
}
