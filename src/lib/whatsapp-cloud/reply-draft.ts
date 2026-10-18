/**
 * Respuesta sugerida (sin IA): lee lo que el cliente escribió desde nuestra
 * última respuesta, detecta qué pregunta (precio, idea, agenda, ubicación,
 * abono…) y qué datos del tatuaje faltan, y arma un borrador con el tono del
 * estudio (corto, cercano). El tatuador lo revisa antes de enviarlo.
 */
import { CHAT_SHORTCUTS, RECOMENDACIONES, suggestReplies } from './chat-shortcuts'
import { studioLocationText } from './studio-location'
import { isTattooInquiry, normalizeText } from './tattoo-keywords'

export type DraftMessage = { direction: 'in' | 'out'; type: string; body: string | null }

const shortcutText = (key: string) => CHAT_SHORTCUTS.find((s) => s.key === key)?.text ?? ''

const has = (text: string, re: RegExp) => re.test(text)

const RE = {
  greeting: /^(hola|holi|buenas|buenos dias|buen dia|buenas tardes|buenas noches|hey|que mas|quiubo|q mas|saludos)\b/,
  price: /\b(precio|cotiz|valor|cuanto (vale|cuesta|cobr|sale|saldria|seria|me sale|me saldria|tendria|costaria|valdria|esta)|presupuesto|tarifa|costo)/,
  agenda: /\b(agendar|agenda\b|disponibilidad|tienes espacio|hay espacio|para cuando|que fecha|que dia|cuando (podria|puedo|tienes|hay)|separar (cita|un espacio|fecha)|sacar (una )?cita)/,
  duration: /\b(cuanto (tiempo )?(se )?demora|cuantas horas|cuanto dura|cuanto tiempo)/,
  pain: /\b(duele|dolor|doloroso)\b/,
  cover: /\b(cover ?up|cubrir|tapar)\b/,
  arriving: /\b(voy en camino|ya voy|estoy llegando|ya llegue|estoy afuera|ya estoy (aca|alla|afuera))\b/,
  reschedule: /\b(cambiar (la )?(cita|fecha|hora)|mover (la )?cita|reprogram|no (puedo|alcanzo|voy a poder) (ir|llegar)|aplazar)/,
  thanks: /^(gracias|muchas gracias|ok|okey|listo|dale|vale|perfecto|bueno|de una|super|genial|👍|🙏|🙌)[\s!.👍🙏🙌🖤❤️]*$/,
  // Datos del tatuaje
  zone: /\b(antebrazo|brazo|bicep|tricep|hombro|espalda|columna|nuca|cuello|pecho|esternon|abdomen|estomago|cadera|gluteo|nalga|pierna|muslo|rodilla|pantorrilla|gemelo|canilla|tobillo|empeine|pie|mano|dedos?|muneca|codo|costilla|costado|clavicula|omoplato|oreja|manga)\b/,
  size: /(\d+ ?(cm|centimetros?)\b|\b(pequeno|pequenito|mediano|grande|chiquito|minimalista|manga|brazo completo|media manga|espalda completa)\b)/,
  color: /\b(a color|en color|full color|colores?|blanco y negro|negro|sombras|sombreado|solo linea|fine ?line|linea fina|rojo)\b/,
  reference: /\b(referencia|foto|imagen|asi como|como este|como esta|este diseno)\b/,
}

function firstName(name: string | null | undefined) {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? ''
  // Nombres raros de contacto (emojis, @usuario, puntos) no se usan.
  return /^[\p{L}]{2,}$/u.test(first) ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : ''
}

/** null = no hay nada pendiente por responder o no sabemos qué sugerir. */
export function buildReplyDraft(messages: DraftMessage[], opts: { clientName?: string | null } = {}): string | null {
  const lastOut = messages.findLastIndex((m) => m.direction === 'out')
  const pending = messages.slice(lastOut + 1).filter((m) => m.direction === 'in')
  if (pending.length === 0) return null

  const pendingText = normalizeText(pending.map((m) => m.body ?? '').join('\n')).trim()
  const sentImage = pending.some((m) => m.type === 'image')
  const firstContact = lastOut === -1
  // Datos del tatuaje que ya dio en toda la conversación.
  const allIn = messages.filter((m) => m.direction === 'in')
  const allText = normalizeText(allIn.map((m) => m.body ?? '').join('\n'))
  const gaveImage = allIn.some((m) => m.type === 'image')

  const shortcuts = new Set(suggestReplies(pendingText))
  const asksPrice = has(pendingText, RE.price)
  const tattoo = sentImage || asksPrice || pending.some((m) => isTattooInquiry(m.body))

  const parts: string[] = []
  const name = firstName(opts.clientName)
  if (firstContact || has(pendingText, RE.greeting)) parts.push(`Hola${name ? ` ${name}` : ''} cómo estás? 🖤`)

  if (has(pendingText, RE.arriving)) return [...parts, 'Dale te espero 🙌'].join('\n\n')

  if (has(pendingText, RE.reschedule)) {
    parts.push('Claro, no hay lío. ¿Para qué día y hora te queda mejor? Reviso la agenda y te confirmo 🫡')
  }

  if (has(pendingText, RE.cover)) {
    parts.push('Claro que sí, mándame una foto de lo que quieres cubrir y la idea que tienes para revisarlo bien 🔥')
  } else if (tattoo) {
    if (sentImage) parts.push('Uff está brutal 🔥')
    else if (firstContact) parts.push('Qué genial, claro que sí.')
    const missing = [
      !has(allText, RE.zone) && '• ¿En qué parte del cuerpo lo quieres?',
      !has(allText, RE.size) && '• ¿De qué tamaño aproximado (en cm)?',
      !has(allText, RE.color) && '• ¿Lo quieres a color o en negro?',
      !gaveImage && !has(allText, RE.reference) && '• Si tienes una imagen de referencia, envíamela 📸',
    ].filter(Boolean) as string[]
    if (missing.length === 4 && !asksPrice) parts.push('¿Qué idea tienes en mente? Cuéntame:')
    else if (missing.length > 0) parts.push(asksPrice ? 'Para darte el valor exacto cuéntame:' : 'Cuéntame:')
    if (missing.length > 0) parts.push(missing.join('\n'))
    else if (asksPrice) parts.push('Listo, ya reviso bien tu idea y te paso el valor 🫡')
  }

  if (has(pendingText, RE.duration)) {
    parts.push('El tiempo depende del tamaño y el detalle; cuando tenga clara tu idea te digo cuántas horas sería aprox.')
  }
  if (has(pendingText, RE.pain)) {
    parts.push('Tranqui, es muy llevadero 🙌 depende un poco de la zona, y hacemos pausas cuando lo necesites.')
  }
  if (has(pendingText, RE.agenda)) parts.push('Perfecto, ¿para qué fecha te queda mejor tu tatuaje?')
  if (has(pendingText, RE.agenda) || shortcuts.has('horario')) parts.push(shortcutText('horario'))
  if (shortcuts.has('ubicacion')) parts.push(`Estamos en ${studioLocationText()}`)
  if (shortcuts.has('comprobante')) parts.push('Perfecto, ya lo reviso y te confirmo tu espacio 🫡')
  else if (shortcuts.has('abono')) parts.push(shortcutText('abono'))
  if (shortcuts.has('menores')) parts.push(shortcutText('menores'))
  // "rojo", "pica"… también salen al cotizar: solo con tatuajes ya hechos.
  if (shortcuts.has('cuidados') && !tattoo) {
    parts.push('Tranqui, mándame una foto de cómo lo ves para revisarlo 🙏 y sigue las indicaciones de cuidado que te envié 🖤')
  }
  if (shortcuts.has('recomendaciones')) parts.push(RECOMENDACIONES)

  const answered = parts.length > (parts[0]?.startsWith('Hola') ? 1 : 0)
  if (!answered) {
    if (has(pendingText, RE.thanks)) parts.push('Dale de una, quedo atento 🫡')
    else if (parts.length > 0) parts.push('¿En qué te puedo ayudar?')
    else return null
  }
  return [...new Set(parts)].join('\n\n')
}
