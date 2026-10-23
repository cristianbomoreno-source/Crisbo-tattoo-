/** Tarjetas "semáforo" del análisis de redes: cada una dice cómo vas, por qué
 * y qué hacer esta semana. Funciones puras (sin red ni base) para probarlas. */

import { cop, copShort } from '@/lib/projects/metrics'
import { daysInMonthKey, monthLong } from './dates'
import type { TiktokMonth, GoogleMonth } from './store'

export type Light = 'good' | 'warn' | 'bad' | 'none'

export type DecisionCard = {
  key: string
  title: string
  light: Light
  /** Cifra principal. */
  value: string
  /** Por qué ese color, con números. */
  detail: string
  /** Qué hacer. */
  action: string
}

export type DecisionInput = {
  today: string
  revenueGoal: number | null
  incomeThisMonth: number
  avgTicket: number | null
  ig: {
    postsLast14: number
    reach30: number
    reachPrev30: number
    profileViews30: number
    websiteClicks30: number
    /** Alcance semanal promedio con BUSY_WEEK_POSTS+ publicaciones vs. con menos (null si no hay ambas). */
    reachBusyWeek: number | null
    reachQuietWeek: number | null
  } | null
  leads: { total30: number; booked30: number; openLeads: number }
  ads: { connected: boolean; spend30: number; conversations30: number; historicCostPerConv: number | null }
  tiktok: { month: string; current: TiktokMonth | null; previous: TiktokMonth | null }
  google: { month: string; current: GoogleMonth | null; previous: GoogleMonth | null }
}

/** Semana "activa" en Instagram: desde cuántas publicaciones. */
export const BUSY_WEEK_POSTS = 2

const pctChange = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null)
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

export function revenueCard(i: DecisionInput): DecisionCard {
  const month = i.today.slice(0, 7)
  const day = Number(i.today.slice(8, 10))
  const total = daysInMonthKey(month)
  const left = total - day
  const base = { key: 'revenue', title: 'Meta de ingresos del mes', value: cop(i.incomeThisMonth) }
  if (!i.revenueGoal) {
    return {
      ...base,
      light: 'none',
      detail: 'Aún no tienes meta. Sin meta no se puede saber si vas bien.',
      action: 'Toca "Editar meta" y pon cuánto necesitas recibir este mes.',
    }
  }
  const missing = Math.max(0, i.revenueGoal - i.incomeThisMonth)
  const pace = (i.revenueGoal * day) / total
  const ratio = pace > 0 ? i.incomeThisMonth / pace : 1
  const light: Light = missing === 0 || ratio >= 1 ? 'good' : ratio >= 0.7 ? 'warn' : 'bad'
  const ticket = i.avgTicket && i.avgTicket > 0 ? i.avgTicket : null
  const tattoos = ticket ? Math.ceil(missing / ticket) : null
  return {
    ...base,
    light,
    detail:
      missing === 0
        ? `Cumpliste la meta de ${cop(i.revenueGoal)}.`
        : `Llevas ${Math.round((i.incomeThisMonth / i.revenueGoal) * 100)}% de ${cop(i.revenueGoal)}. A esta altura del mes deberías llevar ${cop(pace)}. Faltan ${cop(missing)} y quedan ${left} días.`,
    action:
      missing === 0
        ? 'Sube la meta o empieza a llenar la agenda del próximo mes.'
        : tattoos
          ? `Necesitas ~${tattoos} tatuaje${tattoos === 1 ? '' : 's'} de ${copShort(ticket!)} más. ${light === 'bad' ? 'Activa un anuncio de mensajes y responde con "Promo 3 cupos".' : 'Haz seguimiento a los chats en Cotizando.'}`
          : 'Registra los pagos en la app para calcular cuántos tatuajes te faltan.',
  }
}

export function postingCard(i: DecisionInput): DecisionCard {
  const base = { key: 'posting', title: 'Constancia en Instagram' }
  if (!i.ig) return { ...base, light: 'none', value: '—', detail: 'Instagram no está conectado.', action: 'Conéctalo en Ajustes → Instagram.' }
  const n = i.ig.postsLast14
  const light: Light = n >= 6 ? 'good' : n >= 3 ? 'warn' : 'bad'
  const { reachBusyWeek: busy, reachQuietWeek: quiet } = i.ig
  const evidence =
    busy && quiet && busy > quiet
      ? ` Tus semanas con ${BUSY_WEEK_POSTS} o más publicaciones llegan a ${Math.round((busy / quiet - 1) * 100)}% más personas.`
      : ''
  return {
    ...base,
    light,
    value: `${n} en 14 días`,
    detail: `Meta: 3 por semana (6 en 14 días).${evidence}`,
    action:
      light === 'good'
        ? 'Sigue así. Repite el formato de tu publicación con más alcance (abajo).'
        : `Publica ${6 - n} más esta semana y la siguiente. Que al menos 2 sean reels de proceso o resultado.`,
  }
}

export function reachCard(i: DecisionInput): DecisionCard {
  const base = { key: 'reach', title: 'Alcance en Instagram (30 días)' }
  if (!i.ig) return { ...base, light: 'none', value: '—', detail: 'Instagram no está conectado.', action: 'Conéctalo en Ajustes → Instagram.' }
  const ch = pctChange(i.ig.reach30, i.ig.reachPrev30)
  const light: Light = ch === null || ch >= 0 ? 'good' : ch >= -25 ? 'warn' : 'bad'
  return {
    ...base,
    light,
    value: i.ig.reach30.toLocaleString('es-CO'),
    detail: ch === null ? 'Suma del alcance de cada día.' : `${signed(ch)}% frente a los 30 días anteriores (${i.ig.reachPrev30.toLocaleString('es-CO')}).`,
    action:
      light === 'good'
        ? 'Aprovecha: ahora es cuando más gente te ve. Publica la promo en historias.'
        : 'El alcance cae cuando publicas menos. Sube un reel hoy y comparte cada publicación en historias.',
  }
}

export function profileClicksCard(i: DecisionInput): DecisionCard {
  const base = { key: 'clicks', title: 'Del perfil a escribirte' }
  if (!i.ig) return { ...base, light: 'none', value: '—', detail: 'Instagram no está conectado.', action: 'Conéctalo en Ajustes → Instagram.' }
  const { profileViews30: views, websiteClicks30: clicks } = i.ig
  const rate = views > 0 ? (clicks / views) * 100 : 0
  const light: Light = rate >= 5 ? 'good' : rate >= 2 ? 'warn' : 'bad'
  return {
    ...base,
    light,
    value: `${clicks} clics`,
    detail: `${views.toLocaleString('es-CO')} personas vieron tu perfil y ${clicks} tocaron tu enlace (${rate.toFixed(1)}%).`,
    action:
      light === 'good'
        ? 'Tu bio funciona. No la cambies.'
        : 'Pon de primero el enlace directo a WhatsApp (wa.me) y cierra cada reel con "Escríbeme por DM".',
  }
}

export function conversionCard(i: DecisionInput): DecisionCard {
  const { total30, booked30, openLeads } = i.leads
  const rate = total30 > 0 ? (booked30 / total30) * 100 : 0
  const light: Light = total30 === 0 ? 'none' : rate >= 15 ? 'good' : rate >= 7 ? 'warn' : 'bad'
  return {
    key: 'conversion',
    title: 'De chat a cita (30 días)',
    light,
    value: total30 > 0 ? `${Math.round(rate)}%` : '—',
    detail:
      total30 > 0
        ? `${total30} chats nuevos, ${booked30} agendaron. Hay ${openLeads} chats en Cotizando o esperando abono.`
        : 'No llegaron chats nuevos en 30 días.',
    action:
      total30 === 0
        ? 'Sin chats no hay citas: activa un anuncio de mensajes o publica la promo en historias.'
        : light === 'good'
          ? 'Cierras bien: el siguiente paso es traer más chats (anuncios o más reels).'
          : `Escribe hoy a los ${openLeads} chats abiertos y pide el abono con la respuesta rápida.`,
  }
}

export function adsCard(i: DecisionInput): DecisionCard {
  const base = { key: 'ads', title: 'Anuncios de mensajes (30 días)' }
  const { connected, spend30, conversations30, historicCostPerConv } = i.ads
  if (!connected) {
    return {
      ...base,
      light: 'none',
      value: '—',
      detail: 'Facebook y anuncios todavía no están conectados.',
      action: 'Pega el token de Meta abajo, en "Conectar Facebook y anuncios".',
    }
  }
  if (spend30 === 0) {
    const ref = historicCostPerConv ?? 870
    return {
      ...base,
      light: 'none',
      value: '$0',
      detail: 'No tuviste anuncios activos en 30 días.',
      action: `A ~${cop(ref)} por conversación, $50.000 traen ~${Math.floor(50000 / ref)} chats. Úsalo cuando la meta va en rojo.`,
    }
  }
  const cpc = conversations30 > 0 ? spend30 / conversations30 : null
  const light: Light = cpc === null ? 'bad' : cpc <= 1200 ? 'good' : cpc <= 2500 ? 'warn' : 'bad'
  return {
    ...base,
    light,
    value: cpc ? `${cop(cpc)} c/u` : 'Sin chats',
    detail: `Gastaste ${cop(spend30)} y llegaron ${conversations30} conversaciones.`,
    action:
      cpc === null
        ? 'Ese anuncio no trae mensajes: apágalo y usa el objetivo "Mensajes" (no "Reconocimiento").'
        : light === 'good'
          ? 'Funciona: súbele el presupuesto a ese anuncio mientras tengas cupos.'
          : 'Cambia la imagen o el texto del anuncio; si en 3 días no baja, apágalo.',
  }
}

function manualCard(
  key: 'tiktok' | 'google',
  title: string,
  month: string,
  value: number | null,
  previous: number | null,
  unit: string,
  good: string,
  bad: string
): DecisionCard {
  if (value === null) {
    return {
      key,
      title,
      light: 'none',
      value: '—',
      detail: `Faltan los números de ${monthLong(month)}.`,
      action: `Regístralos abajo en "Datos de TikTok y Google". Toma 1 minuto al mes.`,
    }
  }
  const ch = previous !== null ? pctChange(value, previous) : null
  const light: Light = ch === null ? 'none' : ch >= 0 ? 'good' : ch >= -20 ? 'warn' : 'bad'
  return {
    key,
    title,
    light,
    value: `${value.toLocaleString('es-CO')} ${unit}`,
    detail: ch === null ? `${monthLong(month)}. Registra también el mes anterior para comparar.` : `${signed(ch)}% frente al mes anterior (${monthLong(month)}).`,
    action: light === 'good' || light === 'none' ? good : bad,
  }
}

export function buildDecisionCards(i: DecisionInput): DecisionCard[] {
  return [
    revenueCard(i),
    conversionCard(i),
    adsCard(i),
    postingCard(i),
    reachCard(i),
    profileClicksCard(i),
    manualCard(
      'google',
      'Google Maps',
      i.google.month,
      i.google.current ? (i.google.current.directions ?? 0) + (i.google.current.calls ?? 0) : null,
      i.google.previous ? (i.google.previous.directions ?? 0) + (i.google.previous.calls ?? 0) : null,
      'rutas + llamadas',
      'Pide reseña a cada cliente al terminar (el botón ya sale en la sesión finalizada).',
      'Sube fotos nuevas al perfil de Google y revisa que la dirección sea la misma que en Instagram.'
    ),
    manualCard(
      'tiktok',
      'TikTok',
      i.tiktok.month,
      i.tiktok.current?.views ?? null,
      i.tiktok.previous?.views ?? null,
      'vistas',
      'Sube a TikTok los mismos reels de Instagram: no cuesta tiempo extra.',
      'Tu audiencia de TikTok es mitad de fuera de Colombia: usa #bogota y sonidos en tendencia locales.'
    ),
  ]
}
