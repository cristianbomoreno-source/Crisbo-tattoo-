/** Campaña "Nuevos Trazos": plantillas de Marketing de WhatsApp (imagen +
 * texto + pie en letra pequeña + 2 botones de respuesta rápida). */

import type { CampaignGroup } from './audience'

export const CAMPAIGN_NAME = 'Nuevos Trazos'
/** Clave en `campaign_exclusions`. */
export const CAMPAIGN_KEY = 'nuevos_trazos'
export const CAMPAIGN_LANGUAGE = 'es'
/** Imagen del encabezado (1200×628). Meta la descarga de esta URL al enviar. */
export const CAMPAIGN_IMAGE_PATH = '/whatsapp/nuevos-trazos.jpg'
export const CAMPAIGN_FOOTER = 'Aplican términos y condiciones'
export const BUTTON_YES = 'Quiero mi cupo'
export const BUTTON_NO = 'No me interesa'
export const CAMPAIGN_SLOTS = 15

/** Cada mensaje guardado en el chat empieza así: identifica los envíos de la
 * campaña sin columnas nuevas (y en el chat se lee como el encabezado). */
export const CAMPAIGN_MARKER = `🖼️ ${CAMPAIGN_NAME}`

export type CampaignTemplateKey = CampaignGroup | 'recordatorio'

type TemplateDef = { name: string; label: string; body: string; example: string[] }

/** Si Meta rechaza una plantilla, el nombre no se puede reutilizar: subir la
 * versión (`_v2`) al cambiar el texto. */
export const CAMPAIGN_TEMPLATES: Record<CampaignTemplateKey, TemplateDef> = {
  A: {
    name: 'nuevos_trazos_a_v1',
    label: 'Grupo A',
    example: ['Laura'],
    body: [
      'Hola {{1}}, te habla Crisbo 👋',
      '',
      'Esta invitación es solo para quienes ya llevan un tatuaje mío. Sé que hay uno que llevas tiempo pensando… *este es el momento de hacerlo realidad.* ✍️',
      '',
      'Abrí *15 cupos*:',
      '',
      '🖋️ El tatuaje que quieras, hasta 20 cm en blanco y negro, por *$460.000*',
      '🎁 Y te *regalo un tatuaje minimalista*, para ti o para alguien especial',
      '',
      'Disponible hasta el 3 de noviembre o hasta agotar cupos.',
    ].join('\n'),
  },
  B: {
    name: 'nuevos_trazos_b_v1',
    label: 'Grupo B',
    example: ['Andrés'],
    body: [
      'Hola {{1}}, te habla Crisbo 👋',
      '',
      'Ha pasado tiempo desde tu último tatuaje conmigo y quise escribirte primero a ti. 🖋️',
      '',
      'Abrí *15 cupos* para mis clientes de siempre:',
      '',
      '🖋️ El tatuaje que tanto quieres, hasta 20 cm en blanco y negro, por *$460.000*',
      '🎁 Y te *regalo un tatuaje minimalista*, para ti o para alguien especial',
      '',
      'Disponible hasta el 3 de noviembre o hasta agotar cupos.',
    ].join('\n'),
  },
  // Meta no acepta plantillas que empiecen con una variable: va "Hola {{1}}".
  recordatorio: {
    name: 'nuevos_trazos_recordatorio_v1',
    label: 'Recordatorio',
    example: ['Laura', '6'],
    body: [
      'Hola {{1}}, quedan solo *{{2}} cupos* de Nuevos Trazos 🔥',
      '',
      'Tu tatuaje hasta 20 cm en blanco y negro por *$460.000* + un minimalista de regalo 🎁',
      '',
      'Cierra el 3 de noviembre.',
    ].join('\n'),
  },
}

/** Texto final con las variables reemplazadas ({{1}} → "Laura"). */
export function renderTemplate(body: string, params: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (m, n) => params[Number(n) - 1] ?? m)
}

/** Lo que queda guardado en el chat: encabezado, texto, pie y botones. */
export function campaignMessageText(key: CampaignTemplateKey, params: string[]): string {
  return [
    CAMPAIGN_MARKER,
    '',
    renderTemplate(CAMPAIGN_TEMPLATES[key].body, params),
    '',
    `_${CAMPAIGN_FOOTER}_`,
    `[${BUTTON_YES}] [${BUTTON_NO}]`,
  ].join('\n')
}
