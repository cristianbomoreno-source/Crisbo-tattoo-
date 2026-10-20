import Link from 'next/link'
import { ArrowLeft, Gift, Megaphone, Users } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'
import type { CampaignStats } from '@/queries/campaign-stats'
import { BarList, ChartCard, DayColumns, Donut, Funnel, Kpi, StackBar, pct } from './campaign-charts'

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', timeZone: 'America/Bogota' })
    : '—'

/** Estadísticas de una campaña: cifras, gráficos explicados y acceso a la lista de clientes. */
export function CampaignStatsView({ stats: s, listHref }: { stats: CampaignStats; listHref: string }) {
  const reached = s.status.read + s.status.delivered + s.status.sent
  const interested = s.stages.cotizando + s.stages.abono + s.stages.agendado
  const Icon = s.slug === 'bono' ? Gift : Megaphone
  const bestDay = [...s.repliesByDay].sort((a, b) => b.count - a.count)[0]

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link
          href="/dashboard/inbox/campaigns"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60"
          aria-label="Volver a campañas"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-sm font-semibold">{s.name}</h2>
          <p className="truncate text-xs text-muted-foreground">
            Enviada el {fmtDate(s.firstSentAt)}
            {s.lastSentAt && fmtDate(s.lastSentAt) !== fmtDate(s.firstSentAt) && ` · último envío ${fmtDate(s.lastSentAt)}`}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        <p className="text-sm text-muted-foreground">{s.description}</p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="Les llegó" value={`${reached}`} sub={`de ${s.people} · ${pct(reached, s.people)}%`} />
          <Kpi label="Respondieron" value={`${s.replied}`} sub={`${pct(s.replied, reached)}% de a quienes les llegó`} tone="primary" />
          <Kpi label="Interesados" value={`${interested}`} sub="cotizando, abono o agendado" />
          <Kpi
            label={s.revenue ? 'Ingresos' : 'Citas nuevas'}
            value={s.revenue ? cop(s.revenue) : `${s.bookings}`}
            sub={s.revenue ? `${s.bookings} citas nuevas` : 'agendadas desde el envío'}
            tone="good"
          />
        </div>

        <Link
          href={listHref}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/85"
        >
          <Users className="size-4" />
          Ver listado de clientes
        </Link>

        <ChartCard
          title="Del envío a la cita"
          explain={
            <>
              De <b>{s.people}</b> personas a las que se envió, a <b>{reached}</b> les llegó y <b>{s.status.read}</b> la
              abrieron. <b>{s.replied}</b> te escribieron ({pct(s.replied, reached)}%), <b>{interested}</b> quedaron
              cotizando o agendados y salieron <b>{s.bookings}</b> citas nuevas. &quot;Leyeron&quot; se queda corto: quien
              tiene apagadas las confirmaciones de lectura no aparece ahí aunque la haya visto.
            </>
          }
        >
          <Funnel
            steps={[
              { label: 'Enviados', value: s.people, className: 'bg-muted-foreground/40' },
              { label: 'Les llegó', value: reached, className: 'bg-sky-500' },
              { label: 'Leyeron', value: s.status.read, className: 'bg-emerald-500' },
              { label: 'Respondieron', value: s.replied, className: 'bg-primary' },
              { label: 'Cotizando / agendados', value: interested, className: 'bg-amber-500' },
              { label: 'Citas nuevas', value: s.bookings, className: 'bg-emerald-600' },
            ]}
          />
        </ChartCard>

        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard
            title="¿Les llegó el mensaje?"
            explain={
              <>
                <b>Leído</b>: lo abrió. <b>Entregado</b>: le llegó al celular pero no se sabe si lo abrió.{' '}
                <b>Enviado</b>: WhatsApp aún no confirma la entrega (celular apagado o sin internet). <b>No llegó</b>:
                WhatsApp lo rechazó; abajo está el porqué.
              </>
            }
          >
            <Donut
              center={`${pct(reached, s.people)}%`}
              centerSub="les llegó"
              parts={[
                { label: 'Leído', value: s.status.read, stroke: 'stroke-emerald-500', dot: 'bg-emerald-500' },
                { label: 'Entregado', value: s.status.delivered, stroke: 'stroke-sky-500', dot: 'bg-sky-500' },
                { label: 'Enviado', value: s.status.sent, stroke: 'stroke-muted-foreground/50', dot: 'bg-muted-foreground/50' },
                { label: 'No llegó', value: s.status.failed, stroke: 'stroke-destructive', dot: 'bg-destructive' },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Por qué no llegó"
            explain={
              s.failures.length
                ? 'WhatsApp no cobra los mensajes que no se entregan.'
                : undefined
            }
          >
            {s.failures.length ? (
              <BarList items={s.failures.map((f) => ({ label: f.label, value: f.count, hint: f.hint, className: 'bg-destructive/70' }))} />
            ) : (
              <p className="text-sm text-muted-foreground">Le llegó a todos 🎉</p>
            )}
          </ChartCard>
        </div>

        <ChartCard
          title="Respuestas por día"
          explain={
            bestDay?.count ? (
              <>
                Personas que te escribieron por primera vez cada día. El día con más respuestas fue el{' '}
                <b>{fmtDate(`${bestDay.day}T17:00:00Z`)}</b> ({bestDay.count}). Casi todo llega el mismo día del envío:
                contestar rápido ese día es lo que más convierte.
              </>
            ) : (
              'Todavía no hay respuestas.'
            )
          }
        >
          <DayColumns data={s.repliesByDay} />
        </ChartCard>

        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard
            title="En qué van en Mensajes"
            explain={
              <>
                Etapa actual del chat de quienes recibieron la campaña. Los que te escribieron sin hablar de tatuaje
                siguen en <b>Nuevo</b>: vale la pena contestarles a mano.
              </>
            }
          >
            <StackBar
              parts={[
                { label: 'Nuevo', value: s.stages.nuevo, className: 'bg-sky-500' },
                { label: 'Cotizando', value: s.stages.cotizando, className: 'bg-violet-500' },
                { label: 'Abono', value: s.stages.abono, className: 'bg-amber-500' },
                { label: 'Agendado', value: s.stages.agendado, className: 'bg-emerald-500' },
                { label: 'Perdido', value: s.stages.perdido, className: 'bg-muted-foreground/50' },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Cómo reaccionaron"
            explain={
              s.buttons ? (
                <>
                  <b>Quiero mi cupo</b> y <b>No me interesa</b> son los botones del mensaje. Las reacciones (❤️👍) no
                  cuentan como respuesta.
                  {s.reminder && s.reminder.sent > 0 && (
                    <>
                      {' '}
                      El recordatorio (&quot;quedan pocos cupos&quot;) le llegó a <b>{s.reminder.sent}</b> y{' '}
                      <b>{s.reminder.replied}</b> respondieron después de recibirlo.
                    </>
                  )}
                </>
              ) : (
                'Las reacciones (❤️👍) no cuentan como respuesta y no te generan notificación.'
              )
            }
          >
            <BarList
              items={[
                ...(s.buttons
                  ? [
                      { label: 'Quiero mi cupo', value: s.buttons.yes, className: 'bg-emerald-500' },
                      { label: 'No me interesa', value: s.buttons.no, className: 'bg-muted-foreground/50' },
                    ]
                  : []),
                { label: 'Escribieron', value: s.replied, className: 'bg-primary' },
                { label: 'Solo reaccionaron', value: s.reactedOnly, className: 'bg-sky-500' },
                ...(s.reminder ? [{ label: 'Respondieron al recordatorio', value: s.reminder.replied, className: 'bg-amber-500' }] : []),
              ]}
            />
          </ChartCard>
        </div>

        {s.slots && (
          <ChartCard
            title="Cupos"
            explain={`Cupos tomados: se marcan cuando el cliente paga el abono. Quedan ${Math.max(s.slots.total - s.slots.taken, 0)} disponibles.`}
          >
            <div className="flex gap-1.5">
              {Array.from({ length: s.slots.total }, (_, i) => (
                <div key={i} className={`h-3 flex-1 rounded-full ${i < s.slots!.taken ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  )
}
