'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  CaretLeft,
  CaretRight,
  ChatCircleText,
  FilmSlate,
  Images,
  Megaphone,
  Plus,
  Stack,
} from '@phosphor-icons/react'
import { saveMarketingPlanAction } from '@/actions/marketing'
import { cn } from '@/lib/utils'
import {
  FORMAT_LABEL,
  STATUS_LABEL,
  type ActionFormat,
  type ActionStatus,
  type Campaign,
  type MarketingAction,
  type MarketingPlan,
} from '@/lib/marketing/types'
import { ActionEditor } from './action-editor'
import { KPI_ROWS } from './kpis'

export const FORMAT_ICON: Record<ActionFormat, typeof FilmSlate> = {
  reel: FilmSlate,
  carrusel: Stack,
  historias: Images,
  whatsapp: ChatCircleText,
  ads: Megaphone,
}

/** Id nuevo para acciones (a…) y láminas (s…). */
const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const monthFmt = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function monthDays(ym: string) {
  const [y, m] = ym.split('-').map(Number) as [number, number]
  const first = new Date(Date.UTC(y, m - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells: (string | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= count; d++) cells.push(`${ym}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7) cells.push(null)
  return cells
}
const shift = (ym: string, n: number) => {
  const [y, m] = ym.split('-').map(Number) as [number, number]
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

/**
 * crisbotattoo.com/marketing: la estrategia de cierre 2026 editable. Tres
 * vistas (Calendario, Campañas, KPIs). En el calendario cada día muestra
 * sus acciones; se arrastran a otro día (web), se agregan con + y se abren
 * para editar todo: guion, texto del post y las láminas, que se exportan
 * a PNG. Cada cambio se guarda solo, con pausa.
 */
export function MarketingApp({ initialPlan, gallery, today }: { initialPlan: MarketingPlan; gallery: string[]; today: string }) {
  const [plan, setPlan] = useState(initialPlan)
  const [view, setView] = useState<'calendario' | 'campanas' | 'kpis'>('calendario')
  const [month, setMonth] = useState(() => (today >= '2026-10-01' && today <= '2027-01-31' ? today.slice(0, 7) : '2026-11'))
  const [campF, setCampF] = useState<string>('all')
  const [fmtF, setFmtF] = useState<ActionFormat | 'all'>('all')
  const [selectedDay, setSelectedDay] = useState<string>(today)
  const [openId, setOpenId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [dragId, setDragId] = useState<string | null>(null)
  const lastSaved = useRef(JSON.stringify(initialPlan))
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const campById = useMemo(() => new Map(plan.campaigns.map((c) => [c.id, c])), [plan.campaigns])

  // Autoguardado con pausa.
  useEffect(() => {
    const json = JSON.stringify(plan)
    if (json === lastSaved.current) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSaveState('saving')
      const res = await saveMarketingPlanAction(plan)
      if (!res.success) {
        setSaveState('error')
        toast.error(res.error.message)
        return
      }
      const next = { ...plan, version: res.data.version, updatedAt: res.data.updatedAt }
      lastSaved.current = JSON.stringify(next)
      setPlan(next)
      setSaveState('saved')
    }, 900)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [plan])

  const visible = plan.actions.filter((a) => (campF === 'all' || a.camp === campF) && (fmtF === 'all' || a.fmt === fmtF))
  const byDay = useMemo(() => {
    const m = new Map<string, MarketingAction[]>()
    for (const a of visible) m.set(a.date, [...(m.get(a.date) ?? []), a])
    for (const list of m.values()) list.sort((x, y) => (x.time ?? '99').localeCompare(y.time ?? '99'))
    return m
  }, [visible])

  function updateAction(id: string, patch: Partial<MarketingAction>) {
    setPlan((p) => ({ ...p, actions: p.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)) }))
  }
  function addAction(date: string) {
    const id = newId('a')
    const action: MarketingAction = {
      id,
      date,
      fmt: 'reel',
      camp: campF !== 'all' ? campF : 'base',
      title: 'Nueva acción',
      hook: '',
      kw: '',
      status: 'idea',
      script: '',
    }
    setPlan((p) => ({ ...p, actions: [...p.actions, action] }))
    setOpenId(id)
  }
  function removeAction(id: string) {
    setPlan((p) => ({ ...p, actions: p.actions.filter((a) => a.id !== id) }))
    setOpenId(null)
    toast.success('Acción eliminada')
  }
  function duplicateAction(id: string) {
    const src = plan.actions.find((a) => a.id === id)
    if (!src) return
    const copy: MarketingAction = {
      ...structuredClone(src),
      id: newId('a'),
      title: `${src.title} (copia)`,
      status: 'idea',
    }
    setPlan((p) => ({ ...p, actions: [...p.actions, copy] }))
    setOpenId(copy.id)
  }
  function updateCampaign(id: string, patch: Partial<Campaign>) {
    setPlan((p) => ({ ...p, campaigns: p.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }

  const open = plan.actions.find((a) => a.id === openId) ?? null
  const counts = {
    total: plan.actions.length,
    listo: plan.actions.filter((a) => a.status === 'listo').length,
    publicado: plan.actions.filter((a) => a.status === 'publicado').length,
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-16 sm:px-6">
      {/* Encabezado */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-primary uppercase">Crisbo Tattoo · cierre 2026</p>
          <h1 className="large-title lg:text-[2.75rem]">Marketing</h1>
          <p className="text-[15px] text-muted-foreground">
            {counts.total} acciones · {counts.listo} listas · {counts.publicado} publicadas
            <span className="ml-2 font-semibold text-primary">
              {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Guardado ✓' : saveState === 'error' ? 'No se guardó' : ''}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-foreground/[0.07] p-1">
          {(
            [
              ['calendario', 'Calendario'],
              ['campanas', 'Campañas'],
              ['kpis', 'KPIs'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn('h-10 rounded-full px-4 text-[15px] font-semibold', view === v ? 'bg-foreground/15 text-foreground' : 'text-muted-foreground')}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {view === 'calendario' && (
        <>
          {/* Filtros */}
          <div className="space-y-2">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
              <Chip on={campF === 'all'} onClick={() => setCampF('all')}>
                Todas las campañas
              </Chip>
              {plan.campaigns.map((c) => (
                <Chip key={c.id} on={campF === c.id} onClick={() => setCampF(c.id)} dot={c.color}>
                  {c.name}
                </Chip>
              ))}
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
              <Chip on={fmtF === 'all'} onClick={() => setFmtF('all')}>
                Todos los formatos
              </Chip>
              {(Object.keys(FORMAT_LABEL) as ActionFormat[]).map((f) => {
                const I = FORMAT_ICON[f]
                return (
                  <Chip key={f} on={fmtF === f} onClick={() => setFmtF(f)}>
                    <I className="size-4" weight="fill" />
                    {FORMAT_LABEL[f]}
                  </Chip>
                )
              })}
            </div>
          </div>

          {/* Mes */}
          <section className="rounded-[2rem] bg-card p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h2 className="font-title text-[1.5rem] font-bold tracking-tight capitalize">
                <span className="text-primary">{monthFmt.format(new Date(`${month}-01T00:00:00Z`)).split(' ')[0]}</span>{' '}
                <span className="text-muted-foreground">{month.slice(0, 4)}</span>
              </h2>
              <div className="flex gap-2">
                <RoundBtn label="Mes anterior" onClick={() => setMonth((m) => shift(m, -1))}>
                  <CaretLeft className="size-5" weight="bold" />
                </RoundBtn>
                <RoundBtn label="Mes siguiente" onClick={() => setMonth((m) => shift(m, 1))}>
                  <CaretRight className="size-5" weight="bold" />
                </RoundBtn>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-muted-foreground sm:gap-2">
              {WEEKDAYS.map((w) => (
                <span key={w} className="pb-1">
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {monthDays(month).map((day, i) =>
                day ? (
                  <DayCell
                    key={day}
                    day={day}
                    today={today}
                    selected={day === selectedDay}
                    actions={byDay.get(day) ?? []}
                    campById={campById}
                    dragging={!!dragId}
                    onSelect={() => setSelectedDay(day)}
                    onOpen={(id) => setOpenId(id)}
                    onAdd={() => addAction(day)}
                    onDragStart={setDragId}
                    onDrop={() => {
                      if (dragId) updateAction(dragId, { date: day })
                      setDragId(null)
                    }}
                  />
                ) : (
                  <span key={`e${i}`} />
                ),
              )}
            </div>
            <p className="mt-3 hidden px-1 text-[13px] text-muted-foreground sm:block">Arrastra una acción a otro día para moverla. Pasa el mouse sobre un día y toca + para agregar.</p>
          </section>

          {/* Día seleccionado (lista) */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-title text-[1.625rem] font-bold tracking-tight capitalize">
                {new Date(`${selectedDay}T12:00:00Z`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
              </h2>
              <button
                type="button"
                onClick={() => addAction(selectedDay)}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:scale-95"
              >
                <Plus className="size-4" weight="bold" />
                Agregar
              </button>
            </div>
            {(byDay.get(selectedDay) ?? []).length === 0 ? (
              <p className="rounded-[1.25rem] bg-card px-4 py-6 text-center text-muted-foreground">Nada planeado este día.</p>
            ) : (
              <ul className="overflow-hidden rounded-[1.25rem] bg-card [&>li+li]:border-t [&>li+li]:border-border">
                {(byDay.get(selectedDay) ?? []).map((a) => (
                  <ActionRow key={a.id} a={a} camp={campById.get(a.camp)} onOpen={() => setOpenId(a.id)} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {view === 'campanas' && (
        <div className="grid gap-4 md:grid-cols-2">
          {plan.campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              c={c}
              count={plan.actions.filter((a) => a.camp === c.id).length}
              onChange={(p) => updateCampaign(c.id, p)}
              onShow={() => {
                setCampF(c.id)
                setView('calendario')
              }}
            />
          ))}
        </div>
      )}

      {view === 'kpis' && (
        <div className="overflow-x-auto rounded-[1.5rem] bg-card">
          <table className="w-full min-w-[640px] text-left text-[15px] tabular-nums">
            <thead>
              <tr className="text-[12px] tracking-wide text-muted-foreground uppercase">
                {['Indicador', 'Hoy', 'Meta nov', 'Meta dic', 'Dónde lo ves'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t [&>tr]:border-border">
              {KPI_ROWS.map((r) => (
                <tr key={r[0]}>
                  <td className="px-4 py-3 font-semibold">{r[0]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r[1]}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{r[2]}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{r[3]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <ActionEditor
          key={open.id}
          action={open}
          campaigns={plan.campaigns}
          gallery={gallery}
          onChange={(p) => updateAction(open.id, p)}
          onClose={() => setOpenId(null)}
          onDelete={() => removeAction(open.id)}
          onDuplicate={() => duplicateAction(open.id)}
        />
      )}
    </div>
  )
}

function Chip({ on, onClick, dot, children }: { on: boolean; onClick: () => void; dot?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-transform active:scale-95',
        on ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.08]',
      )}
    >
      {dot && <span className="size-2.5 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  )
}

function RoundBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-10 place-items-center rounded-full bg-foreground/[0.07] active:scale-90">
      {children}
    </button>
  )
}

function DayCell({
  day,
  today,
  selected,
  actions,
  campById,
  dragging,
  onSelect,
  onOpen,
  onAdd,
  onDragStart,
  onDrop,
}: {
  day: string
  today: string
  selected: boolean
  actions: MarketingAction[]
  campById: Map<string, Campaign>
  dragging: boolean
  onSelect: () => void
  onOpen: (id: string) => void
  onAdd: () => void
  onDragStart: (id: string | null) => void
  onDrop: () => void
}) {
  const [over, setOver] = useState(false)
  const d = Number(day.slice(8))
  return (
    <div
      onClick={onSelect}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onDrop()
      }}
      className={cn(
        'group relative flex min-h-16 cursor-pointer flex-col gap-1 rounded-xl p-1 text-left transition-colors sm:min-h-28 sm:p-1.5',
        selected ? 'bg-foreground/[0.1] ring-2 ring-primary/60' : 'bg-foreground/[0.04] hover:bg-foreground/[0.07]',
        over && dragging && 'bg-primary/15 ring-2 ring-primary',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'grid size-7 place-items-center rounded-full text-[13px] font-semibold tabular-nums',
            day === today ? 'bg-primary font-bold text-primary-foreground' : 'text-foreground/90',
          )}
        >
          {d}
        </span>
        <button
          type="button"
          aria-label="Agregar acción"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="hidden size-6 place-items-center rounded-full bg-foreground/10 text-muted-foreground group-hover:grid"
        >
          <Plus className="size-3.5" weight="bold" />
        </button>
      </div>
      {/* Celular: puntos. Web: fichas arrastrables. */}
      <div className="flex flex-wrap gap-1 sm:hidden">
        {actions.slice(0, 4).map((a) => (
          <span key={a.id} className="size-2 rounded-full" style={{ background: campById.get(a.camp)?.color }} />
        ))}
      </div>
      <div className="hidden flex-col gap-1 sm:flex">
        {actions.slice(0, 4).map((a) => {
          const I = FORMAT_ICON[a.fmt]
          const c = campById.get(a.camp)
          return (
            <button
              key={a.id}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                onDragStart(a.id)
              }}
              onDragEnd={() => onDragStart(null)}
              onClick={(e) => {
                e.stopPropagation()
                onOpen(a.id)
              }}
              title={a.title}
              className={cn(
                'flex items-center gap-1 rounded-md border-l-[3px] bg-card px-1.5 py-1 text-left text-[12px] leading-tight font-semibold hover:bg-foreground/[0.08]',
                a.status === 'publicado' && 'opacity-50',
              )}
              style={{ borderLeftColor: c?.color }}
            >
              <I className="size-3.5 shrink-0" weight="fill" style={{ color: c?.color }} />
              <span className="truncate">{a.title}</span>
            </button>
          )
        })}
        {actions.length > 4 && <span className="px-1 text-[11px] text-muted-foreground">+{actions.length - 4} más</span>}
      </div>
    </div>
  )
}

function ActionRow({ a, camp, onOpen }: { a: MarketingAction; camp?: Campaign; onOpen: () => void }) {
  const I = FORMAT_ICON[a.fmt]
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-foreground/[0.06]">
        <span className="grid size-11 shrink-0 place-items-center rounded-[0.8rem] text-white" style={{ background: camp?.color }}>
          <I className="size-6" weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1.0625rem] font-semibold">{a.title}</span>
          <span className="block truncate text-[13px] text-muted-foreground">
            {FORMAT_LABEL[a.fmt]}
            {a.time ? ` · ${a.time}` : ''} · {camp?.name}
            {a.kw ? ` · ${a.kw}` : ''}
          </span>
        </span>
        <StatusPill status={a.status} />
      </button>
    </li>
  )
}

export function StatusPill({ status }: { status: ActionStatus }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold',
        status === 'publicado' ? 'bg-income/15 text-income' : status === 'listo' ? 'bg-primary/15 text-primary' : 'bg-foreground/[0.08] text-muted-foreground',
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function CampaignCard({ c, count, onChange, onShow }: { c: Campaign; count: number; onChange: (p: Partial<Campaign>) => void; onShow: () => void }) {
  const field = (k: keyof Campaign, label: string, multiline = true) => (
    <label className="block space-y-1">
      <span className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      {multiline ? (
        <textarea
          value={c[k]}
          onChange={(e) => onChange({ [k]: e.target.value })}
          rows={2}
          className="w-full resize-y rounded-xl bg-foreground/[0.06] px-3 py-2 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <input
          value={c[k]}
          onChange={(e) => onChange({ [k]: e.target.value })}
          className="h-10 w-full rounded-xl bg-foreground/[0.06] px-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
    </label>
  )
  return (
    <article className="space-y-3 overflow-hidden rounded-[1.5rem] bg-card p-5" style={{ boxShadow: `inset 0 4px 0 ${c.color}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={c.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full bg-transparent font-title text-[1.5rem] font-bold tracking-tight outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            {field('dates', 'Fechas', false)}
            {field('kw', 'Palabra clave', false)}
          </div>
        </div>
        <input
          type="color"
          aria-label="Color de la campaña"
          value={c.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="size-9 shrink-0 cursor-pointer rounded-full border-0 bg-transparent"
        />
      </div>
      {field('promise', 'Promesa')}
      {field('price', 'Precio')}
      {field('bonus', 'Bonos')}
      {field('guarantee', 'Garantía')}
      {field('scarcity', 'Escasez real')}
      {field('ads', 'Anuncios y WhatsApp')}
      <button type="button" onClick={onShow} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground/[0.08] px-4 text-[15px] font-semibold">
        Ver sus {count} acciones en el calendario
      </button>
    </article>
  )
}

