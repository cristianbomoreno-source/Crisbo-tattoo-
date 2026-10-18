/** Campaña "Bono de agradecimiento": plantilla de Marketing (imagen + texto,
 * sin botones) con un bono de $100.000 para el próximo tatuaje grande. Va a
 * quien el dueño elija; no tiene grupos ni cupos. */

import { renderTemplate } from './nuevos-trazos'

export const BONO_NAME = 'Bono de agradecimiento'
/** Clave en `campaign_exclusions`. */
export const BONO_KEY = 'bono_agradecimiento'
export const BONO_LANGUAGE = 'es'
/** Imagen del encabezado. Meta la descarga de esta URL al enviar. */
export const BONO_IMAGE_PATH = '/whatsapp/bono-agradecimiento.jpg'
export const BONO_FOOTER = 'Aplican términos y condiciones.'
/** Cada mensaje guardado en el chat empieza así (identifica los envíos). */
export const BONO_MARKER = `🎁 ${BONO_NAME}`

/** Si Meta rechaza la plantilla, el nombre no se puede reutilizar: subir la
 * versión (`_v2`) al cambiar el texto. Meta no acepta empezar con variable. */
export const BONO_TEMPLATE = {
  name: 'bono_agradecimiento_v1',
  label: BONO_NAME,
  example: ['Laura'],
  body: [
    'Hola {{1}}, te habla Crisbo 👋',
    '',
    'Quería escribirte para darte las gracias por *estar ahí y ser parte de Crisbo Tattoo.* 🖤',
    '',
    'Ya sea que te hayas tatuado conmigo o que en algún momento hayas pensado en hacerlo, de alguna manera has sido parte de este camino.',
    '',
    'Y como forma de agradecerte, quiero regalarte un *bono de $100.000* para tu próximo tatuaje conmigo. 🎁🖋️',
    '',
    'Puedes usarlo en tatuajes desde 15 cm hasta el *30 de noviembre*.',
    '',
    'Cuando tengas esa idea que quieres llevar a la piel, escríbeme por aquí. 🖤',
  ].join('\n'),
}

/** Lo que queda guardado en el chat: encabezado, texto y pie. */
export function bonoMessageText(params: string[]): string {
  return [BONO_MARKER, '', renderTemplate(BONO_TEMPLATE.body, params), '', `_${BONO_FOOTER}_`].join('\n')
}
