import type { SupabaseClient } from '@supabase/supabase-js'
import { dayKey, minutesOfDay, todayKey } from '@/lib/calendar/utils'

/**
 * Espacios libres que el agente puede ofrecer. Reglas de Crisbo: un tatuaje
 * grande son mínimo 5 horas, empieza a las 10 am y nunca hay dos grandes el
 * mismo día. `scheduled_at` guarda la hora de Bogotá rotulada como UTC.
 */
export const BIG_MINUTES = 300
const DAY_START = 10 * 60
const DAY_END = 17 * 60
const MIN_GAP = 60
const HORIZON_DAYS = 35

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export type AgendaSession = { scheduled_at: string; duration_minutes: number | null }
export type Agenda = { text: string; days: Set<string> }

const hour = (minutes: number) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`

export function buildAgenda(sessions: AgendaSession[], blocked: string[], openDays: string[] | null, fromKey: string, days = HORIZON_DAYS): Agenda {
  const lines: string[] = []
  const labels = new Set<string>()
  const blockedDays = new Set(blocked)
  const codes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

  for (let i = 1; i <= days; i++) {
    const date = new Date(`${fromKey}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + i)
    const key = date.toISOString().slice(0, 10)
    const weekday = date.getUTCDay()
    if (weekday === 0 || blockedDays.has(key)) continue
    if (openDays?.length && !openDays.includes(codes[weekday]!)) continue

    const busy = sessions
      .filter((s) => dayKey(s.scheduled_at) === key)
      .map((s) => ({ start: minutesOfDay(s.scheduled_at), end: minutesOfDay(s.scheduled_at) + (s.duration_minutes ?? 60) }))
      .sort((a, b) => a.start - b.start)

    const hasBig = busy.some((s) => s.end - s.start >= BIG_MINUTES)
    const morningFree = !busy.some((s) => s.start < DAY_START + BIG_MINUTES && s.end > DAY_START)

    const gaps: string[] = []
    let cursor = DAY_START
    for (const s of busy) {
      if (s.start - cursor >= MIN_GAP) gaps.push(`${hour(cursor)} a ${hour(Math.min(s.start, DAY_END))}`)
      cursor = Math.max(cursor, s.end)
    }
    if (DAY_END - cursor >= MIN_GAP) gaps.push(`${hour(cursor)} a ${hour(DAY_END)}`)

    const label = `${date.getUTCDate()} de ${MONTHS[date.getUTCMonth()]}`
    labels.add(label)
    const big = !hasBig && morningFree ? 'grande SÍ a las 10 am' : 'grande NO'
    lines.push(`${WEEKDAYS[weekday]} ${label}: ${big}; pequeño ${gaps.length ? gaps.join(' y ') : 'NO'}`)
  }
  return { text: lines.join('\n'), days: labels }
}

export async function loadAgenda(admin: SupabaseClient, studioId: string): Promise<Agenda> {
  const from = todayKey()
  const until = new Date(`${from}T00:00:00Z`)
  until.setUTCDate(until.getUTCDate() + HORIZON_DAYS + 1)
  const to = until.toISOString().slice(0, 10)

  const [sessions, blocked, studio] = await Promise.all([
    admin
      .from('sessions')
      .select('scheduled_at, duration_minutes')
      .eq('studio_id', studioId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)
      .limit(500),
    admin.from('blocked_days').select('date').eq('studio_id', studioId).gte('date', from).lte('date', to),
    admin.from('studios').select('open_days').eq('id', studioId).maybeSingle(),
  ])
  if (sessions.error) throw sessions.error
  if (blocked.error) throw blocked.error
  return buildAgenda(
    (sessions.data ?? []) as AgendaSession[],
    (blocked.data ?? []).map((b) => b.date as string),
    (studio.data?.open_days as string[] | null | undefined) ?? null,
    from
  )
}

/** Fechas escritas en un texto como "21 de noviembre". */
export function datesIn(text: string) {
  const months = MONTHS.join('|')
  return [...text.toLowerCase().matchAll(new RegExp(`\\b(\\d{1,2}) de (${months})\\b`, 'g'))].map((m) => `${Number(m[1])} de ${m[2]}`)
}
