/** Confirmación de citas por WhatsApp. 24 h antes de cada cita sale el
 * recordatorio (plantilla de Utilidad con botones "Confirmo mi cita" /
 * "Cancelar cita"). Si a las 12 h de la cita sigue sin respuesta, sale un
 * segundo aviso. La respuesta del cliente (webhook) marca la cita
 * confirmada o cancelada y le contesta solo:
 * - Confirmada → confirmación + recomendaciones para el tatuaje.
 * - Cancelada → la cita se cancela y tiene 5 días para reprogramar o pierde
 *   el abono (la nueva fecha queda sujeta a disponibilidad).
 * `scheduled_at` es hora de Bogotá "disfrazada" de UTC (ver nowAsWallClock). */

export const REMINDER_TEMPLATE = 'cita_recordatorio_v1'
export const FOLLOWUP_TEMPLATE = 'cita_por_confirmar_v1'
export const REMINDER_LANGUAGE = 'es'
export const BUTTON_CONFIRM = 'Confirmo mi cita'
export const BUTTON_CANCEL = 'Cancelar cita'
export const RESCHEDULE_DAYS = 5

export type Confirmation = 'pending' | 'confirmed' | 'cancelled'

export const REMINDER_TEMPLATES = {
  reminder: {
    name: REMINDER_TEMPLATE,
    body: 'Hola {{1}}, te recordamos tu cita de tatuaje en Crisbo Tattoo el {{2}} a las {{3}}. ¿Nos confirmas tu asistencia?',
    example: ['Laura', 'viernes 17 de octubre', '10:00 a. m.'],
  },
  followup: {
    name: FOLLOWUP_TEMPLATE,
    body: 'Hola {{1}}, aún no recibimos la confirmación de tu cita del {{2}} a las {{3}} en Crisbo Tattoo. Por favor confírmanos para mantener tu espacio reservado.',
    example: ['Laura', 'viernes 17 de octubre', '10:00 a. m.'],
  },
} as const

/** "viernes 17 de octubre" desde la hora de pared guardada. */
export function citaDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(iso)
  )
}

/** "10:00 a. m." desde la hora de pared guardada. */
export function citaTime(iso: string) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function firstName(name: string) {
  const w = name.trim().split(/\s+/)[0] ?? ''
  return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : 'Hola'
}

export function confirmedText(name: string, iso: string, studio: { address: string | null; mapsUrl: string | null }) {
  const lines = [
    `¡Gracias, ${firstName(name)}! ✅ Tu cita quedó confirmada para el ${citaDate(iso)} a las ${citaTime(iso)}. Te esperamos.`,
  ]
  if (studio.address) lines.push('', `📍 ${studio.address}`)
  if (studio.mapsUrl) lines.push(studio.mapsUrl)
  return lines.join('\n')
}

export const RECOMMENDATIONS_TEXT = [
  'Recomendaciones para tu tatuaje 🖋️',
  '',
  '• Duerme bien la noche anterior y come algo antes de venir.',
  '• Hidrátate bien desde el día anterior.',
  '• No tomes alcohol en las 24 horas antes de tu cita.',
  '• Evita la aspirina y otros medicamentos que adelgazan la sangre, salvo que tu médico lo indique.',
  '• Llega con la piel de la zona limpia, sin cremas y sin quemaduras de sol.',
  '• Usa ropa cómoda que deje fácil acceso a la zona a tatuar.',
  '• Trae tu documento de identidad.',
  '• Si te sientes enfermo o tienes fiebre, avísanos para reprogramar.',
  '',
  '¡Nos vemos pronto!',
].join('\n')

/** Fecha límite para reprogramar: RESCHEDULE_DAYS días desde hoy (Bogotá). */
export function rescheduleDeadline(now = new Date()) {
  const d = new Date(now.getTime() + RESCHEDULE_DAYS * 86_400_000)
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d)
}

export function cancelledText(name: string, iso: string, now = new Date()) {
  return [
    `Entendido, ${firstName(name)}. Cancelamos tu cita del ${citaDate(iso)} a las ${citaTime(iso)}.`,
    '',
    `Tienes hasta ${RESCHEDULE_DAYS} días (hasta el ${rescheduleDeadline(now)}) para reprogramarla; de lo contrario perderás tu abono. La nueva fecha queda sujeta a la disponibilidad de la agenda.`,
    '',
    'Escríbenos por aquí cuando quieras reprogramar.',
  ].join('\n')
}

/** Texto que guarda el chat para las plantillas enviadas. */
export function templateChatText(kind: keyof typeof REMINDER_TEMPLATES, params: string[]) {
  const body = REMINDER_TEMPLATES[kind].body.replace(/\{\{(\d+)\}\}/g, (m, n) => params[Number(n) - 1] ?? m)
  return `🔔 ${kind === 'reminder' ? 'Recordatorio de cita' : 'Cita por confirmar'}\n\n${body}\n\n[${BUTTON_CONFIRM}] [${BUTTON_CANCEL}]`
}
