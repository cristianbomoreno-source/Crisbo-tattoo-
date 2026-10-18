/**
 * ¿El mensaje es una consulta de tatuaje? Palabras clave sobre el texto en
 * minúscula y sin tildes. Es la lista canónica: la función SQL
 * `is_tattoo_inquiry` (lead-automation.sql, mueve el chat a "Cotizando") se
 * genera con `tattooInquirySqlRegex()` — si cambias la lista, vuelve a
 * aplicar la función en Supabase.
 *
 * Fragmentos de regex: `\b` = borde de palabra (en SQL se traduce a `\y`).
 */
export const TATTOO_KEYWORDS: string[] = [
  // El tatuaje en sí
  '\\btatu', '\\btatt?oo', '\\btattos?\\b','\\btinta\\b', '\\bpieza\\b', '\\bmanga\\b', '\\bsleeve',
  '\\bmedia manga', 'brazo completo', 'pierna completa', 'espalda completa', '\\bcierre del brazo',
  // Precio y cotización
  '\\bcotiz', '\\bprecio', '\\bvalor del', '\\bque valor', '\\bcual (es|seria) el valor', '\\bcuanto (vale|cuesta|cobr|sale|saldria|seria|me sale|me saldria|tendria|costaria|me cobr|me costaria|valdria|esta)',
  '\\bcuanto por\\b', '\\bpresupuesto', '\\btarifa', '\\bcosto\\b', '\\bcostaria', '\\bdescuento', '\\bpromo', '\\bpromocion', '\\bcupo',
  // Diseño e idea
  '\\bdiseno', '\\bdisenar', '\\bboceto', '\\bsketch', '\\bstencil', '\\breferencia', '\\btengo una idea', '\\bmi idea\\b', '\\buna idea\\b',
  '\\bme quiero hacer', '\\bquiero hacerme', '\\bquisiera hacerme', '\\bquiero un\\b.*\\b(en el|en la)\\b', '\\bhacerme (un|una|algo)', '\\bhacerme\\b',
  '\\bme gustaria hacerme', '\\bpienso hacerme', '\\bme lo quiero hacer', '\\biniciales\\b', '\\buna frase\\b', '\\bun nombre\\b', '\\bfecha de nacimiento',
  // Tamaño
  '\\d+ ?cm\\b', '\\bcentimetro', '\\bpequeno\\b.*\\btatu', '\\btamano\\b',
  // Zonas del cuerpo
  '\\bantebrazo', '\\bbrazo\\b', '\\bbicep', '\\btricep', '\\bhombro', '\\bespalda\\b', '\\bcolumna\\b', '\\bnuca\\b', '\\bcuello\\b',
  '\\bpecho\\b', '\\besternon', '\\babdomen', '\\bestomago', '\\bcadera', '\\bgluteo', '\\bnalga', '\\bpierna\\b', '\\bmuslo', '\\brodilla',
  '\\bpantorrilla', '\\bgemelo', '\\bcanilla', '\\btobillo', '\\bempeine', '\\ben la mano\\b', '\\bdedos?\\b', '\\bmuneca\\b', '\\bcodo\\b',
  '\\bcostilla', '\\bcostado\\b', '\\bclavicula', '\\bomoplato', '\\bdetras de la oreja',
  // Estilos y técnica
  '\\brealismo', '\\brealista', '\\bmicro ?realismo', 'fine ?line', '\\blinea fina', '\\bminimalista', '\\btradicional', 'old ?school', '\\bneo ?tradicional',
  'black ?work', '\\bdot ?work', '\\bpuntillismo', '\\bgeometric', '\\bacuarela', '\\blettering', '\\bletras\\b', '\\bcaligrafia', '\\btribal',
  '\\bjapones', '\\boriental', '\\bchicano', '\\bsombread', '\\bsombras\\b', '\\bmandala', '\\banime\\b', 'trash ?polka', '\\bbiomecanic', '\\bornamental',
  'blanco y negro', '\\ba color\\b', '\\ben color\\b', '\\ba full color', '\\bsolo linea',
  // Arreglos
  'cover ?up', '\\bcubrir\\b', '\\btapar\\b', '\\bretoque', '\\brepasar', '\\brellenar', '\\barreglar (un|mi) tatu',
  // Agenda
  '\\bagendar', '\\bagenda\\b', '\\bdisponibilidad', '\\bespacio para', '\\bseparar (cita|un espacio|fecha)', '\\bsacar (una )?cita', '\\buna cita\\b',
  '\\bsesion', '\\bcuanto (tiempo )?(se )?demora', '\\bcuantas horas',
  // Otros servicios
  '\\bpiercing', '\\bperforacion',
]

/** Mensajes que nunca cuentan: respuestas a historias, reels/publicaciones
 * compartidas, campañas, y reenvíos largos. */
const IGNORE_PREFIX = /^(↩️ Respondió a tu historia|🎬 Compartió|🔗 Compartió|📣|🎁)/
const MAX_LENGTH = 600

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

const TATTOO_RE = new RegExp(`(${TATTOO_KEYWORDS.join('|')})`)

export function isTattooInquiry(text: string | null | undefined) {
  if (!text || text.length > MAX_LENGTH || IGNORE_PREFIX.test(text)) return false
  return TATTOO_RE.test(normalizeText(text))
}

/** La misma lista en sintaxis de Postgres (`\b` → `\y`). */
export function tattooInquirySqlRegex() {
  return `(${TATTOO_KEYWORDS.join('|')})`.replace(/\\b/g, '\\y')
}
