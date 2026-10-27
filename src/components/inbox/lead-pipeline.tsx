'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowsLeftRight, BellRinging } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { cop } from '@/lib/projects/metrics'
import { setLeadStage } from '@/actions/whatsapp'
import { markLeadLostAction } from '@/actions/crm'
import { LEAD_STAGES, followUpDue, type LeadStage } from '@/lib/whatsapp-cloud/lead'
import { chatChannel } from '@/lib/instagram/channel'
import { leadSource } from '@/lib/crm/options'
import type { WaConversation } from '@/queries/whatsapp'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LostReasonDialog } from './lost-reason-dialog'
import { chatInitials, chatName } from './format'

const OPEN_STAGES = LEAD_STAGES.filter((s) => s.key !== 'perdido')

function waited(iso: string | null, now = Date.now()) {
  if (!iso) return ''
  const h = Math.max(0, Math.round((now - Date.parse(iso)) / 3_600_000))
  if (h < 1) return 'ahora'
  if (h < 24) return `${h} h`
  const d = Math.round(h / 24)
  return d < 30 ? `${d} d` : `${Math.round(d / 30)} m`
}

/**
 * Embudo de leads de Mensajes (vista "Embudo"): una columna por etapa con
 * cuántos chats hay, la plata en juego (saldo de proyectos abiertos o la
 * cotización en espera) y cuánto llevan ahí. En escritorio se arrastran las
 * tarjetas entre columnas; en el celular las columnas se deslizan de lado y
 * cada tarjeta tiene "Mover a…". Pasar a Perdido pide el motivo.
 * Arriba, la conversión por origen (de dónde llegan los que sí agendan).
 * Las etapas también se mueven solas (lead-automation.sql); esto solo
 * permite corregirlas a mano.
 */
export function LeadPipeline({ conversations, leadValues }: { conversations: WaConversation[]; leadValues: Record<string, number> }) {
  const [overrides, setOverrides] = useState<Record<string, LeadStage>>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<LeadStage | null>(null)
  const [losing, setLosing] = useState<WaConversation | null>(null)
  const [showLost, setShowLost] = useState(false)
  const [, startTransition] = useTransition()

  const stageOf = (c: WaConversation) => overrides[c.id] ?? c.lead_stage
  const [now] = useState(() => Date.now())

  const byStage = useMemo(() => {
    const map = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, [] as WaConversation[]])) as Record<LeadStage, WaConversation[]>
    for (const c of conversations) map[overrides[c.id] ?? c.lead_stage]?.push(c)
    for (const list of Object.values(map)) list.sort((a, b) => Date.parse(b.last_message_at) - Date.parse(a.last_message_at))
    return map
  }, [conversations, overrides])

  const sources = useMemo(() => {
    const agg = new Map<string, { total: number; won: number }>()
    for (const c of conversations) {
      const key = leadSource(c.client?.source, chatChannel(c))
      const row = agg.get(key) ?? { total: 0, won: 0 }
      row.total++
      if ((overrides[c.id] ?? c.lead_stage) === 'agendado') row.won++
      agg.set(key, row)
    }
    return [...agg.entries()].sort((a, b) => b[1].total - a[1].total)
  }, [conversations, overrides])

  function move(c: WaConversation, next: LeadStage) {
    if (stageOf(c) === next) return
    if (next === 'perdido') {
      setLosing(c)
      return
    }
    const prev = stageOf(c)
    setOverrides((o) => ({ ...o, [c.id]: next }))
    startTransition(async () => {
      const res = await setLeadStage(c.id, next)
      if (!res.success) {
        setOverrides((o) => ({ ...o, [c.id]: prev }))
        toast.error(res.error.message)
      }
    })
  }

  function confirmLost(reason: string) {
    const c = losing
    setLosing(null)
    if (!c) return
    const prev = stageOf(c)
    setOverrides((o) => ({ ...o, [c.id]: 'perdido' }))
    startTransition(async () => {
      const res = await markLeadLostAction(c.id, c.client_id, reason)
      if (!res.success) {
        setOverrides((o) => ({ ...o, [c.id]: prev }))
        toast.error(res.error.message)
      } else toast.success(`Perdido · ${reason}`)
    })
  }

  const totalValue = OPEN_STAGES.slice(0, 3).reduce(
    (sum, s) => sum + byStage[s.key].reduce((v, c) => v + (c.client_id ? (leadValues[c.client_id] ?? 0) : 0), 0),
    0,
  )

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Resumen: plata en juego + conversión por origen */}
      <section className="grid gap-3 lg:grid-cols-[1fr_2fr]">
        <div className="tile-teal relative overflow-hidden rounded-[1.75rem] p-5 text-white">
          <p className="text-[13px] font-semibold tracking-wide text-white/75 uppercase">Plata en juego</p>
          <p className="mt-1 font-title text-[2.25rem] leading-none font-bold tabular-nums">{cop(totalValue)}</p>
          <p className="mt-1.5 text-[15px] text-white/75">En leads nuevos, cotizando y esperando abono</p>
        </div>
        <div className="rounded-[1.75rem] bg-card p-5">
          <h3 className="font-title text-[1.25rem] font-bold tracking-tight">De dónde llegan los que agendan</h3>
          <ul className="mt-3 space-y-2.5">
            {sources.slice(0, 5).map(([name, { total, won }]) => {
              const pct = total ? Math.round((won / total) * 100) : 0
              return (
                <li key={name} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-[15px]">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                    <span className="block h-full rounded-full bg-income" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {won}/{total} · <span className="font-semibold text-foreground">{pct}%</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Columnas */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {OPEN_STAGES.map((st) => {
          const list = byStage[st.key]
          const value = list.reduce((v, c) => v + (c.client_id ? (leadValues[c.client_id] ?? 0) : 0), 0)
          return (
            <section
              key={st.key}
              onDragOver={(e) => {
                e.preventDefault()
                setOverStage(st.key)
              }}
              onDragLeave={() => setOverStage((s) => (s === st.key ? null : s))}
              onDrop={(e) => {
                e.preventDefault()
                const c = conversations.find((x) => x.id === dragId)
                setOverStage(null)
                setDragId(null)
                if (c) move(c, st.key)
              }}
              className={cn(
                'flex w-[82%] shrink-0 snap-start flex-col gap-2.5 rounded-[1.75rem] bg-foreground/[0.04] p-2.5 transition-colors sm:w-80 lg:w-auto',
                overStage === st.key && 'bg-primary/10 ring-2 ring-primary/50',
              )}
            >
              <header className={cn('rounded-[1.25rem] px-4 py-3 text-white', st.tile)}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[1.125rem] font-bold">{st.label}</h3>
                  <span className="font-title text-[1.375rem] font-bold tabular-nums">{list.length}</span>
                </div>
                <p className="text-[13px] font-semibold text-white/75 tabular-nums">{value > 0 ? cop(value) : 'Sin valor'}</p>
              </header>

              <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto lg:max-h-[calc(100dvh-24rem)]">
                {list.length === 0 && <p className="px-2 py-6 text-center text-[15px] text-muted-foreground">Nadie aquí</p>}
                {list.map((c) => (
                  <PipelineCard
                    key={c.id}
                    c={c}
                    stage={stageOf(c)}
                    value={c.client_id ? (leadValues[c.client_id] ?? 0) : 0}
                    waitedLabel={waited(c.lead_stage_at ?? c.created_at, now)}
                    dragging={dragId === c.id}
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setOverStage(null)
                    }}
                    onMove={(s) => move(c, s)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Perdidos: aparte, plegados */}
      <section
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const c = conversations.find((x) => x.id === dragId)
          setDragId(null)
          if (c) move(c, 'perdido')
        }}
        className="rounded-[1.75rem] bg-foreground/[0.04] p-2.5"
      >
        <button
          type="button"
          onClick={() => setShowLost((v) => !v)}
          className="tile-gray flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left text-white"
        >
          <span className="text-[1.125rem] font-bold">Perdidos</span>
          <span className="text-[15px] font-semibold text-white/80">
            {byStage.perdido.length} · {showLost ? 'Ocultar' : 'Ver'}
          </span>
        </button>
        {showLost && (
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {byStage.perdido.map((c) => (
              <PipelineCard
                key={c.id}
                c={c}
                stage="perdido"
                value={0}
                waitedLabel={waited(c.lead_stage_at ?? c.created_at, now)}
                dragging={false}
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => setDragId(null)}
                onMove={(s) => move(c, s)}
              />
            ))}
          </div>
        )}
      </section>

      <LostReasonDialog open={!!losing} onOpenChange={(o) => !o && setLosing(null)} onPick={confirmLost} />
    </div>
  )
}

function PipelineCard({
  c,
  stage,
  value,
  waitedLabel,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  c: WaConversation
  stage: LeadStage
  value: number
  waitedLabel: string
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onMove: (s: LeadStage) => void
}) {
  const name = chatName(c)
  const due = followUpDue(c.follow_up_at)
  const tile = LEAD_STAGES.find((s) => s.key === stage)?.tile
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn('relative rounded-[1.25rem] bg-card transition-[opacity,transform] duration-150 ease-out', dragging && 'scale-95 opacity-40')}
    >
      <Link href={`/dashboard/inbox/${c.id}`} className="flex gap-3 p-3 pr-12 active:scale-[0.98]">
        <span className={cn('grid size-11 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white', tile)}>
          {chatInitials(name.replace(/^@/, ''))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1.0625rem] leading-tight font-semibold">{name}</span>
          <span className="block truncate text-[13px] text-muted-foreground">{c.last_message_preview || '…'}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold">
            <span className="rounded-full bg-foreground/[0.08] px-2 py-0.5 text-muted-foreground">{waitedLabel}</span>
            {value > 0 && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary tabular-nums">{cop(value)}</span>}
            {c.follow_up_at && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                  due ? 'bg-destructive/15 text-destructive' : 'bg-foreground/[0.08] text-muted-foreground',
                )}
              >
                <BellRinging className="size-3" weight="fill" />
                {due ? 'Hoy' : 'Seguimiento'}
              </span>
            )}
          </span>
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Mover a otra etapa"
          className="absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-foreground/[0.08] text-muted-foreground"
        >
          <ArrowsLeftRight className="size-4" weight="bold" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Mover a</DropdownMenuLabel>
            {LEAD_STAGES.filter((s) => s.key !== stage).map((s) => (
              <DropdownMenuItem key={s.key} onClick={() => onMove(s.key)}>
                <span className={cn('size-3 rounded-full', s.tile)} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
