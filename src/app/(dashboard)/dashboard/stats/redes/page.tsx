import { redirect } from 'next/navigation'
import { getCurrentStudio } from '@/queries/studio'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadInstagramAccount } from '@/lib/instagram/account'
import { loadInstagramOverview, weeklyPostingVsReach, type IgOverview } from '@/lib/social/instagram-insights'
import { loadMetaOverview, type MetaOverview } from '@/lib/social/meta-ads'
import { loadBusinessOverview } from '@/lib/social/business'
import { loadMetaSecret, loadSocialSettings } from '@/lib/social/store'
import { buildDecisionCards, BUSY_WEEK_POSTS } from '@/lib/social/decisions'
import { addDays, bogotaDay, monthLong, monthShort, shiftMonthKey } from '@/lib/social/dates'
import { cop, copShort } from '@/lib/projects/metrics'

import { StatsTabs } from '@/components/social/stats-tabs'
import { DecisionCards } from '@/components/social/decision-cards'
import { ReachArea, MonthBars, StackedMonthBars } from '@/components/social/social-charts'
import { RevenueGoalEditor, ManualMonthForm, MetaConnectForm } from '@/components/social/social-forms'
import { ChartCard, Kpi, Funnel, BarList } from '@/components/campaigns/campaign-charts'

export const metadata = { title: 'Redes sociales · Estadísticas' }

const num = (n: number) => n.toLocaleString('es-CO')

export default async function SocialStatsPage() {
  const studio = await getCurrentStudio()
  if (!studio || studio.role !== 'owner') redirect('/dashboard/stats')

  const admin = createAdminClient()
  const today = bogotaDay()
  const thisMonth = today.slice(0, 7)

  const [settings, metaSecret, business, igResult] = await Promise.all([
    loadSocialSettings(admin, studio.id),
    loadMetaSecret(admin, studio.id),
    loadBusinessOverview(admin, studio.id),
    loadInstagramAccount(admin, studio.id)
      .then(async (acc) => (acc ? { ig: await loadInstagramOverview(acc), error: null } : { ig: null, error: 'Instagram no está conectado.' }))
      .catch((e: Error) => ({ ig: null as IgOverview | null, error: e.message })),
  ])
  const meta: MetaOverview | null = metaSecret ? await loadMetaOverview(metaSecret.token) : null
  const ig = igResult.ig

  // ----- Instagram: ventanas de 30 días y semanas -----
  const since30 = addDays(today, -29)
  const since60 = addDays(today, -59)
  const reach30 = ig?.dailyReach.filter((d) => d.day >= since30).reduce((s, d) => s + d.reach, 0) ?? 0
  const reachPrev30 = ig?.dailyReach.filter((d) => d.day >= since60 && d.day < since30).reduce((s, d) => s + d.reach, 0) ?? 0
  const postsLast14 = ig?.posts.filter((p) => bogotaDay(new Date(p.timestamp)) >= addDays(today, -13)).length ?? 0
  const weeks = ig ? weeklyPostingVsReach(ig) : []
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, n) => s + n, 0) / xs.length) : null)
  const busy = avg(weeks.filter((w) => w.posts >= BUSY_WEEK_POSTS).map((w) => w.reach))
  const quiet = avg(weeks.filter((w) => w.posts < BUSY_WEEK_POSTS).map((w) => w.reach))
  const postDays = new Set(ig?.posts.map((p) => bogotaDay(new Date(p.timestamp))) ?? [])
  const bestMonth = ig?.monthly.reduce((a, b) => (b.views > a.views ? b : a))
  const topPosts = [...(ig?.posts ?? [])].sort((a, b) => b.reach - a.reach).slice(0, 5)

  // ----- Anuncios -----
  const ads = meta?.ads ?? null
  const adsSpend6 = ads?.monthly.reduce((s, m) => s + m.spend, 0) ?? 0
  const adsConv6 = ads?.monthly.reduce((s, m) => s + m.conversations, 0) ?? 0

  // ----- Datos manuales: el último mes cerrado -----
  const lastClosed = shiftMonthKey(thisMonth, -1)
  const beforeClosed = shiftMonthKey(thisMonth, -2)

  const cards = buildDecisionCards({
    today,
    revenueGoal: settings.revenueGoal,
    incomeThisMonth: business.incomeThisMonth,
    avgTicket: business.avgTicket,
    ig: ig
      ? {
          postsLast14,
          reach30,
          reachPrev30,
          profileViews30: ig.last30.profile_views,
          websiteClicks30: ig.last30.website_clicks,
          reachBusyWeek: busy,
          reachQuietWeek: quiet,
        }
      : null,
    leads: { total30: business.funnel30.total, booked30: business.funnel30.agendado, openLeads: business.openLeads },
    ads: {
      connected: Boolean(ads),
      spend30: ads?.last30.spend ?? 0,
      conversations30: ads?.last30.conversations ?? 0,
      historicCostPerConv: adsConv6 > 0 ? Math.round(adsSpend6 / adsConv6) : null,
    },
    tiktok: { month: lastClosed, current: settings.manual.tiktok[lastClosed] ?? null, previous: settings.manual.tiktok[beforeClosed] ?? null },
    google: { month: lastClosed, current: settings.manual.google[lastClosed] ?? null, previous: settings.manual.google[beforeClosed] ?? null },
  })

  const manualMonths = Array.from({ length: 6 }, (_, i) => shiftMonthKey(thisMonth, -i - 1)).map((key) => ({
    key,
    label: monthLong(key),
  }))
  const savedManual = [...new Set([...Object.keys(settings.manual.google), ...Object.keys(settings.manual.tiktok)])]
    .sort()
    .reverse()
    .slice(0, 6)

  const f = business.funnel30

  return (
    <div className="space-y-4">
      <StatsTabs active="redes" />

      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold">Redes y ventas</h1>
        <p className="text-sm text-muted-foreground">
          Lo que pasa en tus redes cruzado con chats, citas y pagos de la app. Arriba, qué hacer esta semana.
        </p>
      </header>

      <DecisionCards cards={cards} goalEditor={<RevenueGoalEditor goal={settings.revenueGoal} />} />

      {/* ───────────── Negocio ───────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Pagos recibidos por mes"
          explain={
            settings.revenueGoal
              ? `La línea punteada es tu meta (${cop(settings.revenueGoal)}). Solo cuenta los pagos registrados en la app.`
              : 'Solo cuenta los pagos registrados en la app. Pon una meta arriba para verla como línea.'
          }
        >
          <MonthBars
            items={business.monthly.map((m) => ({ label: monthShort(m.month), value: m.income, highlight: m.month === thisMonth }))}
            goal={settings.revenueGoal}
            format={copShort}
            barClass="bg-primary/45"
          />
        </ChartCard>
        <ChartCard
          title="Chats nuevos por mes"
          explain="Personas que te escribieron por primera vez. Si suben los chats pero no los pagos, el problema está en cerrar, no en atraer."
        >
          <StackedMonthBars
            items={business.monthly.map((m) => ({ label: monthShort(m.month), values: [m.leadsWhatsapp, m.leadsInstagram] }))}
            series={[
              { label: 'WhatsApp', className: 'bg-emerald-500/80' },
              { label: 'Instagram', className: 'bg-fuchsia-500/80' },
            ]}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Embudo de los últimos 30 días"
        explain={`De ${f.total} chats nuevos, ${f.agendado} ya tienen cita y ${f.perdido} se perdieron. Hoy hay ${business.openLeads} chats abiertos (Cotizando o esperando abono): ahí está la plata más rápida.`}
      >
        <Funnel
          steps={[
            { label: 'Escribieron', value: f.total, className: 'bg-sky-400' },
            { label: 'Pidieron precio', value: f.cotizando + f.abono + f.agendado, className: 'bg-violet-400' },
            { label: 'Les pedí abono', value: f.abono + f.agendado, className: 'bg-amber-400' },
            { label: 'Agendaron', value: f.agendado, className: 'bg-emerald-500' },
          ]}
        />
      </ChartCard>

      {/* ───────────── Instagram ───────────── */}
      <h2 className="pt-2 font-display text-lg font-semibold">Instagram{ig?.username ? ` · @${ig.username}` : ''}</h2>
      {!ig ? (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">No se pudo leer Instagram: {igResult.error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              label="Seguidores"
              value={num(ig.followers)}
              sub={ig.dailyFollows.length ? `+${num(ig.dailyFollows.reduce((s, d) => s + d.value, 0))} nuevos en 30 días` : undefined}
            />
            <Kpi label="Alcance 30 días" value={num(reach30)} sub={`antes ${num(reachPrev30)}`} tone="primary" />
            <Kpi label="Visitas al perfil" value={num(ig.last30.profile_views)} sub="30 días" />
            <Kpi label="Clics al enlace" value={num(ig.last30.website_clicks)} sub="30 días" />
          </div>

          <ChartCard
            title="Alcance diario (90 días)"
            explain="Cada punto es un día en que publicaste. Mira cómo sube la curva después de publicar y cae en los días sin contenido."
          >
            <ReachArea data={ig.dailyReach} postDays={postDays} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Publicaciones por semana vs. alcance"
              explain={
                busy && quiet
                  ? `Semanas con ${BUSY_WEEK_POSTS}+ publicaciones: ${num(busy)} de alcance promedio. Con menos: ${num(quiet)}.`
                  : 'Alcance de cada semana completa y cuántas veces publicaste.'
              }
            >
              <BarList
                items={weeks.slice(-8).map((w) => ({
                  label: `Semana del ${Number(w.week.slice(8))}/${Number(w.week.slice(5, 7))} · ${w.posts} publicación${w.posts === 1 ? '' : 'es'}`,
                  value: w.reach,
                  className: w.posts >= BUSY_WEEK_POSTS ? 'bg-primary' : 'bg-primary/35',
                }))}
              />
            </ChartCard>
            <ChartCard
              title="Vistas e interacciones por mes"
              explain={`Vistas = veces que se vio tu contenido.${bestMonth?.views ? ` Tu mejor mes fue ${monthLong(bestMonth.month)}: repite lo que publicaste ese mes.` : ''}`}
            >
              <MonthBars
                items={ig.monthly.map((m) => ({ label: monthShort(m.month), value: m.views, highlight: m.month === thisMonth }))}
                format={(n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))}
                barClass="bg-primary/45"
              />
              <BarList
                items={ig.monthly
                  .slice(-3)
                  .reverse()
                  .map((m) => ({
                    label: `${monthLong(m.month)}: interacciones`,
                    value: m.total_interactions,
                    hint: `${num(m.shares)} compartidos · ${num(m.saves)} guardados · ${num(m.profile_views)} visitas al perfil`,
                  }))}
              />
            </ChartCard>
          </div>

          <ChartCard
            title="Tus 5 publicaciones con más alcance"
            explain="Haz más de lo que funciona: mismo formato, mismo tipo de gancho al inicio. Los compartidos son la señal que más empuja el alcance."
          >
            <ol className="space-y-2">
              {topPosts.map((p, i) => (
                <li key={p.id}>
                  <a
                    href={p.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 rounded-xl p-2 ring-1 ring-foreground/5 hover:bg-muted/50"
                  >
                    <span className="font-display text-lg font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.caption || 'Sin texto'}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {p.type === 'REELS' ? 'Reel' : 'Publicación'} ·{' '}
                        {new Date(p.timestamp).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {num(p.reach)} alcance ·{' '}
                        {num(p.shares)} compartidos · {num(p.saves)} guardados
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </ChartCard>
        </>
      )}

      {/* ───────────── Facebook y anuncios ───────────── */}
      <h2 className="pt-2 font-display text-lg font-semibold">Facebook y anuncios</h2>
      {ads ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title={`Inversión por mes · ${ads.accountName}`}
            explain={
              adsConv6 > 0
                ? `En 6 meses: ${cop(adsSpend6)} → ${num(adsConv6)} conversaciones (${cop(adsSpend6 / adsConv6)} cada una).`
                : 'Ningún anuncio trajo conversaciones de mensajes en estos meses.'
            }
          >
            <MonthBars
              items={ads.monthly.map((m) => ({ label: monthShort(m.month), value: m.spend, highlight: m.month === thisMonth }))}
              format={copShort}
              barClass="bg-sky-500/60"
            />
          </ChartCard>
          <ChartCard
            title="Campañas de los últimos 30 días"
            explain="Las que gastan y no traen conversaciones se apagan. El objetivo que mejor te funciona es Mensajes."
          >
            {ads.campaigns30.length ? (
              <BarList
                items={ads.campaigns30.map((c) => ({
                  label: c.name,
                  value: c.conversations,
                  hint: `${cop(c.spend)} gastados · ${c.conversations ? `${cop(c.spend / c.conversations)} por conversación` : 'sin conversaciones'}`,
                  className: c.conversations ? 'bg-emerald-500' : 'bg-rose-500',
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Sin anuncios activos en 30 días.</p>
            )}
          </ChartCard>
        </div>
      ) : meta ? (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">No se pudieron leer los anuncios: {meta.adsError}</p>
      ) : null}
      {meta && (
        <p className="text-xs text-muted-foreground">
          {meta.page ? `Página ${meta.page.name}: ${num(meta.page.followers)} seguidores.` : `Página de Facebook: ${meta.pageError}`}
        </p>
      )}
      <ChartCard title={meta ? 'Conexión con Facebook y anuncios' : 'Conectar Facebook y anuncios'}>
        <MetaConnectForm connected={Boolean(metaSecret)} savedAt={metaSecret?.savedAt ?? null} />
      </ChartCard>

      {/* ───────────── Google y TikTok (a mano) ───────────── */}
      <h2 className="pt-2 font-display text-lg font-semibold">Google Maps y TikTok</h2>
      <ChartCard
        title="Datos de TikTok y Google"
        explain="Estas dos no dejan leer sus estadísticas desde la app: copia los números una vez al mes (el día 1, del mes que terminó)."
      >
        <ManualMonthForm months={manualMonths} saved={settings.manual} />
        {savedManual.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-1 font-medium">Mes</th>
                  <th className="font-medium">Google vistas</th>
                  <th className="font-medium">Rutas</th>
                  <th className="font-medium">Llamadas</th>
                  <th className="font-medium">Reseñas</th>
                  <th className="font-medium">TikTok vistas</th>
                  <th className="font-medium">Seguidores</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {savedManual.map((m) => {
                  const g = settings.manual.google[m]
                  const t = settings.manual.tiktok[m]
                  const c = (v: number | null | undefined) => (v == null ? '—' : num(v))
                  return (
                    <tr key={m} className="border-t border-border">
                      <td className="py-1.5 capitalize">{monthLong(m)}</td>
                      <td>{c(g?.views)}</td>
                      <td>{c(g?.directions)}</td>
                      <td>{c(g?.calls)}</td>
                      <td>{c(g?.reviews)}</td>
                      <td>{c(t?.views)}</td>
                      <td>{c(t?.followers)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  )
}
