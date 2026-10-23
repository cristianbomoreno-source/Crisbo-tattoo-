import { lastMonths, bogotaDay, addDays } from './dates'

/** Facebook (página) y anuncios de Meta con el token del usuario del sistema
 * que el dueño pega en el análisis de redes. Solo lectura. */

const GRAPH = 'https://graph.facebook.com/v23.0'
const REVALIDATE_S = 6 * 3600

/** Conversaciones de mensajes que inició un anuncio (WhatsApp/IG/Messenger). */
const CONVERSATION_ACTION = 'onsite_conversion.messaging_conversation_started_7d'

export const META_REQUIRED_SCOPES = ['ads_read', 'pages_read_engagement', 'read_insights'] as const

async function fb<T>(path: string, token: string, cache = true): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    ...(cache ? { next: { revalidate: REVALIDATE_S } } : { cache: 'no-store' as const }),
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!res.ok || json.error) throw new Error(json.error?.message || `Meta respondió ${res.status}`)
  return json
}

/** Revisa un token recién pegado: quién es y qué permisos tiene. */
export async function checkMetaToken(token: string) {
  const me = await fb<{ id: string; name?: string }>('/me?fields=id,name', token, false)
  const perms = await fb<{ data: { permission: string; status: string }[] }>('/me/permissions', token, false).catch(() => ({
    data: [],
  }))
  const granted = new Set(perms.data.filter((p) => p.status === 'granted').map((p) => p.permission))
  return { name: me.name ?? me.id, missing: META_REQUIRED_SCOPES.filter((s) => !granted.has(s)) }
}

type Action = { action_type: string; value: string }
type InsightRow = {
  spend?: string
  impressions?: string
  reach?: string
  actions?: Action[]
  date_start: string
  campaign_name?: string
  objective?: string
}

const conversations = (actions?: Action[]) =>
  Number(actions?.find((a) => a.action_type === CONVERSATION_ACTION)?.value ?? 0)

export type AdsMonth = { month: string; spend: number; conversations: number; impressions: number }
export type AdsCampaign = { name: string; objective: string; spend: number; conversations: number }

export type MetaOverview = {
  page: { name: string; followers: number } | null
  pageError: string | null
  ads: {
    accountName: string
    monthly: AdsMonth[]
    last30: { spend: number; conversations: number; impressions: number }
    campaigns30: AdsCampaign[]
  } | null
  adsError: string | null
}

export async function loadMetaOverview(token: string, months = 6): Promise<MetaOverview> {
  const today = bogotaDay()
  const thisMonth = today.slice(0, 7)
  const keys = lastMonths(thisMonth, months)

  const pagePromise = fb<{ data: { name: string; followers_count?: number; fan_count?: number }[] }>(
    '/me/accounts?fields=name,followers_count,fan_count',
    token
  )
    .then((r) => {
      const p = r.data?.[0]
      return p ? { name: p.name, followers: p.followers_count ?? p.fan_count ?? 0 } : null
    })
    .then((page) => ({ page, pageError: page ? null : 'El usuario del sistema no tiene la página asignada.' }))
    .catch((e: Error) => ({ page: null, pageError: e.message }))

  const adsPromise = (async () => {
    const accounts = await fb<{ data: { id: string; name: string; account_status: number }[] }>(
      '/me/adaccounts?fields=name,account_status',
      token
    )
    const acc = accounts.data?.find((a) => a.account_status === 1) ?? accounts.data?.[0]
    if (!acc) throw new Error('El usuario del sistema no tiene una cuenta publicitaria asignada.')

    const range = (since: string, until: string) => encodeURIComponent(JSON.stringify({ since, until }))
    const [monthlyRows, last30Rows, campaignRows] = await Promise.all([
      fb<{ data: InsightRow[] }>(
        `/${acc.id}/insights?fields=spend,impressions,actions&time_increment=monthly&time_range=${range(`${keys[0]}-01`, today)}`,
        token
      ),
      fb<{ data: InsightRow[] }>(
        `/${acc.id}/insights?fields=spend,impressions,actions&time_range=${range(addDays(today, -29), today)}`,
        token
      ),
      fb<{ data: InsightRow[] }>(
        `/${acc.id}/insights?level=campaign&fields=campaign_name,objective,spend,actions&time_range=${range(addDays(today, -29), today)}&limit=50`,
        token
      ),
    ])

    const byMonth = new Map((monthlyRows.data ?? []).map((r) => [r.date_start.slice(0, 7), r]))
    const l = last30Rows.data?.[0]
    return {
      accountName: acc.name,
      monthly: keys.map((month) => {
        const r = byMonth.get(month)
        return {
          month,
          spend: Number(r?.spend ?? 0),
          conversations: conversations(r?.actions),
          impressions: Number(r?.impressions ?? 0),
        }
      }),
      last30: { spend: Number(l?.spend ?? 0), conversations: conversations(l?.actions), impressions: Number(l?.impressions ?? 0) },
      campaigns30: (campaignRows.data ?? [])
        .map((r) => ({
          name: r.campaign_name ?? 'Campaña',
          objective: r.objective ?? '',
          spend: Number(r.spend ?? 0),
          conversations: conversations(r.actions),
        }))
        .filter((c) => c.spend > 0)
        .sort((a, b) => b.spend - a.spend),
    }
  })()
    .then((ads) => ({ ads, adsError: null }))
    .catch((e: Error) => ({ ads: null, adsError: e.message }))

  const [page, ads] = await Promise.all([pagePromise, adsPromise])
  return { ...page, ...ads }
}

