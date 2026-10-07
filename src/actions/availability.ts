'use server'

import { getSessions } from '@/queries/sessions'
import { getBlockedDayKeys } from '@/queries/blocked-days'
import { getCurrentStudio } from '@/queries/studio'
import { dayKey, minutesOfDay, expandClosedWeekdays } from '@/lib/calendar/utils'
import { ok, type Result } from '@/lib/errors/types'

export type DayAvailability = {
  blockedDays: string[]
  busyDays: string[]
  slotsByDay: Record<string, { start: number; end: number }[]>
  slotIntervalMinutes: number
}

/**
 * Disponibilidad del calendario para un rango de fechas: qué días están
 * bloqueados, cuáles ya tienen alguna cita, y qué franjas horarias (en
 * minutos desde medianoche) están ocupadas por día — más el intervalo de
 * horas configurado en Ajustes. La usan los pickers de fecha/hora
 * personalizados (agendar sesión, cotización rápida) para marcar en rojo
 * días con cita/bloqueados y ocultar horas ya tomadas.
 */
export async function getAvailabilityAction(from: string, to: string): Promise<Result<DayAvailability>> {
  const [sessionsRes, blockedDateKeys, studio] = await Promise.all([
    getSessions(from, to),
    getBlockedDayKeys(from, to),
    getCurrentStudio(),
  ])
  const sessions = sessionsRes.success ? sessionsRes.data : []
  const active = sessions.filter((s) => s.status !== 'cancelled')

  // Antes solo se marcaban las fechas puntuales de `blocked_days` — un día
  // de la semana marcado como "no laboral" en Ajustes → Horario (open_days)
  // no aparecía bloqueado acá, así que se podía agendar (p. ej.) un domingo
  // aunque el estudio no trabaje domingos.
  const closedWeekdayKeys = expandClosedWeekdays(from.slice(0, 10), to.slice(0, 10), studio?.openDays)
  const blockedDays = Array.from(new Set([...blockedDateKeys, ...closedWeekdayKeys]))

  const busyDaysSet = new Set<string>()
  const slotsByDay: Record<string, { start: number; end: number }[]> = {}
  for (const s of active) {
    const key = dayKey(s.scheduled_at)
    busyDaysSet.add(key)
    const start = minutesOfDay(s.scheduled_at)
    const end = start + (s.duration_minutes ?? 60)
    slotsByDay[key] = [...(slotsByDay[key] ?? []), { start, end }]
  }

  return ok({
    blockedDays,
    busyDays: [...busyDaysSet],
    slotsByDay,
    slotIntervalMinutes: studio?.slotIntervalMinutes ?? 30,
  })
}

/** Datos para el popup de calendario del Inicio (mes/semana/día, sin salir de
 * la pantalla): sesiones + días bloqueados del rango dado. */
export async function getCalendarPopupDataAction(
  from: string,
  to: string
): Promise<Result<{ sessions: import('@/queries/sessions').SessionWithProject[]; blockedDays: string[] }>> {
  const [sessionsRes, blockedDateKeys, studio] = await Promise.all([
    getSessions(from, to),
    getBlockedDayKeys(from, to),
    getCurrentStudio(),
  ])
  const closedWeekdayKeys = expandClosedWeekdays(from.slice(0, 10), to.slice(0, 10), studio?.openDays)
  const blockedDays = Array.from(new Set([...blockedDateKeys, ...closedWeekdayKeys]))
  return ok({
    sessions: sessionsRes.success ? sessionsRes.data : [],
    blockedDays,
  })
}
