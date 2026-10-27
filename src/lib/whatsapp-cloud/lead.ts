/**
 * Seguimiento de leads en la bandeja de WhatsApp: cada chat avanza por un
 * embudo simple (columna `wa_conversations.lead_stage`) y puede tener un
 * recordatorio de seguimiento (`follow_up_at`).
 */

export const LEAD_STAGES = [
  { key: 'nuevo', tile: 'tile-blue', label: 'Nuevo', short: 'Nuevo', dot: 'bg-sky-400', chip: 'bg-sky-400/15 text-sky-700 dark:text-sky-300' },
  { key: 'cotizando', tile: 'tile-purple', label: 'Cotizando', short: 'Cotizando', dot: 'bg-violet-400', chip: 'bg-violet-400/15 text-violet-700 dark:text-violet-300' },
  { key: 'abono', tile: 'tile-gold', label: 'Esperando abono', short: 'Abono', dot: 'bg-amber-400', chip: 'bg-amber-400/15 text-amber-700 dark:text-amber-300' },
  { key: 'agendado', tile: 'tile-green', label: 'Agendado', short: 'Agendado', dot: 'bg-emerald-400', chip: 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-300' },
  { key: 'perdido', tile: 'tile-gray', label: 'Perdido', short: 'Perdido', dot: 'bg-zinc-500', chip: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
] as const

export type LeadStage = (typeof LEAD_STAGES)[number]['key']

export const LEAD_STAGE_KEYS = LEAD_STAGES.map((s) => s.key) as [LeadStage, ...LeadStage[]]

export function leadStageInfo(stage: string | null | undefined) {
  return LEAD_STAGES.find((s) => s.key === stage) ?? LEAD_STAGES[0]
}

/** Opciones rápidas de "Recordar seguimiento". */
export const FOLLOW_UP_OPTIONS = [
  { key: '3h', label: 'En 3 horas', hours: 3 },
  { key: '1d', label: 'Mañana', hours: 24 },
  { key: '3d', label: 'En 3 días', hours: 72 },
  { key: '1w', label: 'En 1 semana', hours: 168 },
] as const

/** Colombia: UTC−5 todo el año. */
const BOGOTA_OFFSET_MS = -5 * 3_600_000

/**
 * Fecha del recordatorio: las opciones de días caen a las 10:00 a. m. (hora
 * de Colombia) de ese día, para no recordar un chat a medianoche.
 */
export function followUpDate(hours: number, now = Date.now()) {
  const at = now + hours * 3_600_000
  if (hours < 24) return new Date(at)
  const local = new Date(at + BOGOTA_OFFSET_MS)
  local.setUTCHours(10, 0, 0, 0)
  return new Date(local.getTime() - BOGOTA_OFFSET_MS)
}

export function followUpDue(followUpAt: string | null | undefined, now = Date.now()) {
  return !!followUpAt && new Date(followUpAt).getTime() <= now
}
