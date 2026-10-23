/** Mensajes fijos del estudio que se envían con un toque desde el chat
 * (botones bajo el cuadro de texto). Son mensajes normales, no plantillas:
 * gratis, pero solo dentro de la ventana de 24 h. El texto sale de las
 * respuestas que el estudio usa siempre con sus clientes. */

export type ChatShortcut = {
  key: string
  label: string
  /** Texto a enviar, o pie de foto si lleva imagen. */
  text: string
  /** Ruta pública (en /public) de la imagen a enviar. */
  image?: string
}

/** También se envía sola cuando el cliente confirma su cita (recordatorio). */
export const RECOMENDACIONES = [
  'Gracias por elegirnos para tu tatuaje, ¡es un momento emocionante! Aquí tienes algunas recomendaciones importantes para que sea una gran experiencia:',
  '',
  '1. *Descansa bien la noche anterior:* dormir lo suficiente te ayudará a sentirte relajado y preparado.',
  '2. *Hidrátate y come antes de tu cita:* estar bien alimentado y con energía es clave para evitar mareos o malestar.',
  '3. *Evita el alcohol y sustancias estimulantes* al menos 24 horas antes del tatuaje. Estas afectan la cicatrización y la calidad del proceso.',
  '4. *Usa ropa cómoda* que facilite el acceso a la zona del tatuaje.',
  '5. *Confía en nosotros:* te explicaremos todo el proceso y resolveremos cualquier duda para que te sientas seguro.',
  '',
  'Recuerda, este es un momento para disfrutar y expresar algo significativo en tu piel. ¡Nos aseguraremos de que sea una experiencia única!',
].join('\n')

/** Promo de la historia/estado "Nuevos Trazos — quedan 3 cupos" (oct–nov 2026):
 * se reserva con el pago completo. */
export const PROMO_NUEVOS_TRAZOS = [
  '¡Hola! 🙌 Gracias por escribir. Esta es la promo *Nuevos Trazos*:',
  '',
  '🖋️ Tu tatuaje hasta 20 cm en blanco y negro por *$460.000*',
  '🎁 + un tatuaje minimalista de regalo (hasta 5 cm, línea fina), para ti o para quien quieras',
  '📅 Se tatúan del 27 de octubre al 1 de noviembre',
  '⏳ Quedan solo 3 cupos. La oferta cierra el 3 de noviembre',
  '',
  'Para reservar tu cupo se paga el *valor completo ($460.000)* por Llave Bre-B:',
  '🔑 1019126345',
  '',
  'Envíame por aquí el comprobante junto con tu idea (foto de referencia, zona del cuerpo y tamaño) y te confirmo el día y la hora. ✅',
].join('\n')

export const CHAT_SHORTCUTS: ChatShortcut[] = [
  { key: 'promo', label: 'Promo 3 cupos', text: PROMO_NUEVOS_TRAZOS, image: '/whatsapp/nuevos-trazos-3-cupos.jpg' },
  {
    key: 'abono',
    label: 'Abono',
    text: 'Para separar tu cita solicito un abono del 20% sobre el valor total de tu proyecto. Lo puedes realizar por Bre-B a la llave 1019126345. Una vez me envíes tu comprobante procedemos a separar tu espacio.',
  },
  { key: 'comprobante', label: 'Pedir comprobante', text: 'Una vez efectuado el abono, envía el comprobante' },
  { key: 'recomendaciones', label: 'Recomendaciones', text: RECOMENDACIONES },
  { key: 'horario', label: 'Horario', text: 'Trabajamos de lunes a sábado de 10:00 a. m. a 5:00 p. m.' },
  {
    key: 'menores',
    label: 'Menores de edad',
    text: 'Al ser menor de edad es necesario que tus padres firmen un consentimiento informado. Te lo envío una vez separes tu cita, y ellos deben estar presentes el día del tatuaje.',
  },
  { key: 'cuidados', label: 'Cuidados', text: '¿Cómo cuidar tu tatuaje? 🖤', image: '/whatsapp/cuidados-tatuaje.jpg' },
]

export function findShortcut(key: string) {
  return CHAT_SHORTCUTS.find((s) => s.key === key) ?? null
}

/* ───────────── Sugerencias por palabras clave ───────────── */

/** Claves sugeribles: los botones de arriba + Ubicación y Enviar formulario. */
export type SuggestionKey = ChatShortcut['key'] | 'ubicacion' | 'formulario'

/** Palabras/frases (sin tildes, en minúscula) que delatan qué necesita el
 * cliente. Salen de las conversaciones reales del estudio. */
const KEYWORDS: Record<SuggestionKey, (string | RegExp)[]> = {
  promo: ['promo', 'cupo', 'nuevos trazos', '460', 'respondio a tu historia', 'la oferta', 'el descuento'],
  abono: ['separar', 'apartar', 'reservar', 'como pago', 'como hago para', 'hay que pagar', 'pagar algo', 'abono', 'adelanto', 'transferencia', 'nequi', 'bre-b', 'breb', 'llave', 'cuenta'],
  comprobante: ['ya te hice el abono', 'ya hice el abono', 'ya pague', 'ya te pague', 'ya transferi', 'ya consigne', 'ya te transferi', 'ya te envie la plata', 'ya abone'],
  formulario: ['comprobante', 'ya pague', 'ya te pague', 'ya hice el abono', 'ya te hice el abono', 'ya transferi', 'ya abone', 'mis datos', 'que datos'],
  recomendaciones: ['antes de la cita', 'recomendacion', 'puedo tomar', 'puedo beber', 'puedo comer', 'que debo hacer antes', 'algun cuidado antes', 'primer tatuaje', 'nervios'],
  horario: ['horario', 'a que hora', 'que horas', 'que dias', 'abren', 'atienden', 'cierran', 'domingo', 'festivo'],
  menores: ['menor de edad', 'soy menor', /\b1[0-7]\s*anos\b/, 'mi mama', 'mi papa', 'mis papas', 'mis padres', 'permiso'],
  cuidados: ['como lo cuido', 'como cuidar', 'cuidados', 'crema', 'rojito', 'rojo', 'inflamad', 'hinchad', 'pelando', 'bota tinta', 'botando tinta', 'pica', 'vendaje', 'vinipel', 'costra', 'es normal'],
  ubicacion: ['donde queda', 'donde quedan', 'donde estan', 'direccion', 'ubicacion', 'ubicados', 'como llego', 'en que parte', 'barrio'],
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Botones que mejor responden a lo que escribió el cliente, del más al
 * menos probable (por número de coincidencias). */
export function suggestReplies(clientText: string): SuggestionKey[] {
  const text = normalize(clientText)
  if (!text.trim()) return []
  const scored = (Object.keys(KEYWORDS) as SuggestionKey[])
    .map((key) => ({
      key,
      score: (KEYWORDS[key] ?? []).filter((k) => (typeof k === 'string' ? text.includes(k) : k.test(text))).length,
    }))
    .filter((s) => s.score > 0)
  return scored.sort((a, b) => b.score - a.score).map((s) => s.key)
}
