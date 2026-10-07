/** Plantillas de mensajes de WhatsApp editables por el tatuador
 * (Ajustes → Personalización → Plantillas de WhatsApp, `mensajes-form.tsx`).
 * Reutiliza `buildMessage` (reemplazo de placeholders `{clave}`) que ya
 * vivía en `lib/quotes/message.ts` para el mensaje de cotización — acá se
 * re-exporta para las plantillas nuevas, sin duplicar lógica. */
export { buildMessage } from '@/lib/quotes/message'

/** Mensaje de cotización (ya existía, `quote_message_template`). Se
 * re-exporta con el mismo nombre que el resto de plantillas para que
 * `mensajes-form.tsx` pueda listarlas todas de forma pareja. */
export { DEFAULT_TEMPLATE as DEFAULT_QUOTE_TEMPLATE } from '@/lib/quotes/message'

/** Recordatorio de saldo pendiente (Finanzas → Pendientes por cobrar). */
export const DEFAULT_BALANCE_TEMPLATE =
  'Hola {nombre_cliente}! Te escribo para recordarte el saldo pendiente de tu tatuaje: {saldo}.'

/** Recordatorio de sesión agendada (tarjeta "Próxima sesión" en Inicio). */
export const DEFAULT_SESSION_TEMPLATE =
  'Hola {nombre_cliente}, te recuerdo tu cita el {fecha} a las {hora}. ¡Te espero!'

/** Confirmación de cita agendada — se manda apenas se crea la cita (desde el
 * calendario, una cotización o un proyecto) y también es el mensaje del
 * botón "Confirmar cita" al tocar una cita ya agendada en el calendario. */
export const DEFAULT_BOOKING_CONFIRMATION_TEMPLATE =
  'Hola {nombre_cliente}! Tu cita quedó confirmada para el {fecha} a las {hora} en {lugar}, con {nombre_tatuador}. ¡Te esperamos!'

/** Contacto general desde la ficha o el popup de un proyecto. */
export const DEFAULT_CONTACT_TEMPLATE =
  'Hola {nombre_cliente}! Te escribo por tu proyecto "{nombre_proyecto}".'

/** Mensaje del bot: lo que el CLIENTE le envía al ESTUDIO al terminar la
 * solicitud (`(bot)/t/[slug]`). `{cierre}` no es editable palabra por
 * palabra — lo arma `buildIntakeMessage` según si hay fotos o no. */
export { DEFAULT_BOT_CONTACT_TEMPLATE } from '@/lib/intake/message'

/** Mensaje de "Reservar mi proyecto" / "¿Tienes dudas?" en la landing
 * pública de una cotización (`/proyecto/[token]`). */
export { DEFAULT_QUOTE_CONFIRM_TEMPLATE } from '@/lib/pdf/quote-template-data'
