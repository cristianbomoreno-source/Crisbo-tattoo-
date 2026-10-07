import type { IntakeInput } from '@/lib/validations/intake'
import { buildMessage } from '@/lib/quotes/message'

/** Plantilla por defecto (editable en Ajustes → Personalización → Plantillas
 * de WhatsApp, `bot_contact_template`) del mensaje que el cliente le envía
 * al estudio por WhatsApp al terminar el bot. `{cierre}` ya viene resuelto
 * (con o sin mención de fotos) — no es un dato editable palabra por palabra,
 * varía solo por cantidad de fotos subidas. */
export const DEFAULT_BOT_CONTACT_TEMPLATE = [
  'Hola *{nombre_estudio}*! Soy *{nombre_cliente}* ({genero}, {edad} años) y quiero cotizar un tatuaje:',
  '· Zona: {zona}',
  '· Tamaño: {tamano}',
  '· Color: {color}',
  '· Idea: {idea}',
  '{cierre}',
].join('\n')

/** Mensaje que el cliente le envía al estudio por WhatsApp con su solicitud.
 * `template` es opcional (por compatibilidad con el uso existente) — si no
 * se pasa, usa la plantilla por defecto de arriba, con el mismo resultado
 * de siempre. */
export function buildIntakeMessage(
  studioName: string,
  input: Pick<IntakeInput, 'name' | 'gender' | 'age' | 'body_zone' | 'size' | 'color' | 'description'>,
  photoCount: number,
  template?: string | null
): string {
  const closing =
    photoCount > 0
      ? `Ya te dejé la solicitud completa con ${photoCount === 1 ? 'mi foto' : 'mis fotos'} de referencia en tu panel de OFINK.`
      : 'Ya te dejé la solicitud completa en tu panel de OFINK.'
  return buildMessage(template || DEFAULT_BOT_CONTACT_TEMPLATE, {
    nombre_estudio: studioName,
    nombre_cliente: input.name,
    genero: input.gender,
    edad: String(input.age),
    zona: input.body_zone,
    tamano: input.size,
    color: input.color,
    idea: input.description,
    cierre: closing,
  })
}
