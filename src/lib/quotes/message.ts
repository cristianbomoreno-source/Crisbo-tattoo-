/** Reemplaza placeholders `{clave}` en la plantilla del mensaje de cotización
 * con los valores de `vars`. Placeholder sin valor -> cadena vacía. */
export function buildMessage(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

export const DEFAULT_TEMPLATE =
  'Hola, {nombre_cliente}. Con mucho gusto te comparto la cotización de tu proyecto de tatuaje {nombre_proyecto}. Valor: {valor}. Número de sesiones: {numero_sesiones}. Estoy muy entusiasmado por realizar esta pieza y convertir tu idea en un tatuaje único, con toda la dedicación y calidad que merece. Si tienes alguna duda o deseas realizar algún ajuste, estaré encantado de ayudarte. ¡Gracias por confiar en mi trabajo!'
