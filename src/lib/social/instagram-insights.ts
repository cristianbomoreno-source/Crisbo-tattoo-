import type { IgAccountCredentials } from '@/lib/instagram/api'
import { addDays, bogotaDay, dayStart, lastMonths, shiftMonthKey } from './dates'

/** Estadísticas de Instagram (graph.instagram.com) para el análisis de redes.
 * Se piden en vivo y Next las guarda 6 h: la API da hasta 2 años de historia,
 * así que no hace falta guardar copias en la base. */

const GRAPH = `https://graph.instagram.com/${process.env.INSTAGRAM_GRAPH_VERSION || 'v23.0'}`
const REVALIDATE_S = 6 * 3600
const MAX_WINDOW_S = 30 * 86400

type Json = Record<string, unknown>

async function ig<T = Json>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: REVALIDATE_S },
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!res.ok || json.error) throw new Error(json.error?.message || `Instagram respondió ${res.status}`)
  return json
}

const TOTAL_METRICS = ['views', 'profile_views', 'website_clicks', 'accounts_engaged', 'total_interactions', 'shares', 'saves'] as const
export type IgTotals = Record<(typeof TOTAL_METRICS)[number], number>

export type IgPost = {
  id: string
  caption: string
  type: 'REELS' | 'FEED' | 'STORY' | string
  timestamp: string
  permalink: string
  likes: number
  comments: number
  reach: number
  views: number
  shares: number
  saves: number
}

export type IgOverview = {
  username: string | null
  followers: number
  mediaCount: number
  /** Alcance diario de los últimos 90 días (día de Colombia → personas). */
  dailyReach: { day: string; reach: number }[]
  /** Seguidores nuevos por día (últimos 30 días). */
  dailyFollows: { day: string; value: number }[]
  monthly: ({ month: string } & IgTotals)[]
  /** Totales de los últimos 30 días. */
  last30: IgTotals
  posts: IgPost[]
}

type InsightRow = { name: string; values?: { value: number; end_time: string }[]; total_value?: { value: number } }

const unix = (d: Date) => Math.floor(d.getTime() / 1000)

/** El valor diario llega con end_time al final del día (hora del Pacífico):
 * se le resta un día para saber a qué día corresponde. */
const valueDay = (endTime: string) => addDays(endTime.slice(0, 10), -1)

async function dailySeries(token: string, metric: string, days: number, now: Date) {
  const out = new Map<string, number>()
  const windows: [number, number][] = []
  for (let end = unix(now); end > unix(now) - days * 86400; end -= MAX_WINDOW_S) {
    windows.push([Math.max(end - MAX_WINDOW_S, unix(now) - days * 86400), end])
  }
  const rows = await Promise.all(
    windows.map(([since, until]) =>
      ig<{ data: InsightRow[] }>(`/me/insights?metric=${metric}&period=day&since=${since}&until=${until}`, token)
    )
  )
  for (const r of rows) for (const v of r.data?.[0]?.values ?? []) out.set(valueDay(v.end_time), v.value)
  return [...out.entries()].sort(([a], [b]) => a.localeCompare(b))
}

async function totalsBetween(token: string, from: Date, to: Date): Promise<IgTotals> {
  const sum = Object.fromEntries(TOTAL_METRICS.map((m) => [m, 0])) as IgTotals
  const calls: Promise<{ data: InsightRow[] }>[] = []
  for (let since = unix(from); since < unix(to); since += MAX_WINDOW_S) {
    const until = Math.min(since + MAX_WINDOW_S, unix(to))
    calls.push(
      ig(
        `/me/insights?metric=${TOTAL_METRICS.join(',')}&period=day&metric_type=total_value&since=${since}&until=${until}`,
        token
      )
    )
  }
  for (const r of await Promise.all(calls)) {
    for (const m of r.data ?? []) {
      if (m.name in sum) sum[m.name as keyof IgTotals] += m.total_value?.value ?? 0
    }
  }
  return sum
}

export async function loadInstagramOverview(account: IgAccountCredentials, months = 6): Promise<IgOverview> {
  const token = account.access_token
  // Redondeado a bloques de 3 h: las URLs (since/until) se repiten y la
  // caché de Next sí sirve entre visitas.
  const BLOCK_MS = 3 * 3_600_000
  const now = new Date(Math.floor(Date.now() / BLOCK_MS) * BLOCK_MS)
  const thisMonth = bogotaDay(now).slice(0, 7)

  const monthKeys = lastMonths(thisMonth, months)
  const [profile, reach, follows, monthly, last30, media] = await Promise.all([
    ig<{ username?: string; followers_count?: number; media_count?: number }>(
      '/me?fields=username,followers_count,media_count',
      token
    ),
    dailySeries(token, 'reach', 90, now),
    dailySeries(token, 'follower_count', 29, now).catch(() => [] as [string, number][]),
    Promise.all(
      monthKeys.map(async (month) => {
        const from = dayStart(`${month}-01`)
        const next = dayStart(`${shiftMonthKey(month, 1)}-01`)
        const totals = await totalsBetween(token, from, next < now ? next : now).catch(
          () => Object.fromEntries(TOTAL_METRICS.map((m) => [m, 0])) as IgTotals
        )
        return { month, ...totals }
      })
    ),
    totalsBetween(token, new Date(now.getTime() - MAX_WINDOW_S * 1000), now),
    ig<{ data: { id: string; caption?: string; media_product_type?: string; timestamp: string; permalink: string; like_count?: number; comments_count?: number }[] }>(
      '/me/media?fields=id,caption,media_product_type,timestamp,permalink,like_count,comments_count&limit=50',
      token
    ),
  ])

  const posts = await Promise.all(
    (media.data ?? []).map(async (m): Promise<IgPost> => {
      const ins = await ig<{ data: InsightRow[] }>(`/${m.id}/insights?metric=reach,views,saved,shares`, token).catch(
        () => ({ data: [] as InsightRow[] })
      )
      const val = (name: string) => ins.data?.find((x) => x.name === name)?.values?.[0]?.value ?? 0
      return {
        id: m.id,
        caption: (m.caption ?? '').split('\n')[0]?.slice(0, 90) ?? '',
        type: m.media_product_type ?? 'FEED',
        timestamp: m.timestamp,
        permalink: m.permalink,
        likes: m.like_count ?? 0,
        comments: m.comments_count ?? 0,
        reach: val('reach'),
        views: val('views'),
        shares: val('shares'),
        saves: val('saved'),
      }
    })
  )

  return {
    username: profile.username ?? null,
    followers: profile.followers_count ?? 0,
    mediaCount: profile.media_count ?? 0,
    dailyReach: reach.map(([day, value]) => ({ day, reach: value })),
    dailyFollows: follows.map(([day, value]) => ({ day, value })),
    monthly,
    last30,
    posts,
  }
}

/** Publicaciones de cada semana (lunes a domingo, hora de Colombia) y el
 * alcance de esa semana: muestra si publicar más trae más gente. */
export function weeklyPostingVsReach(ov: Pick<IgOverview, 'dailyReach' | 'posts'>) {
  const weekOf = (day: string) => {
    const d = new Date(`${day}T12:00:00Z`)
    return addDays(day, -((d.getUTCDay() + 6) % 7))
  }
  const weeks = new Map<string, { week: string; posts: number; reach: number; days: number }>()
  for (const r of ov.dailyReach) {
    const w = weekOf(r.day)
    const cur = weeks.get(w) ?? { week: w, posts: 0, reach: 0, days: 0 }
    cur.reach += r.reach
    cur.days += 1
    weeks.set(w, cur)
  }
  for (const p of ov.posts) {
    const w = weeks.get(weekOf(bogotaDay(new Date(p.timestamp))))
    if (w) w.posts += 1
  }
  // Solo semanas completas (la primera y la actual pueden estar a medias).
  return [...weeks.values()].filter((w) => w.days === 7).sort((a, b) => a.week.localeCompare(b.week))
}
