'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegment } from 'next/navigation'
import { Archive, BellRing, Megaphone, MessageCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { WaConversation } from '@/queries/whatsapp'
import { LEAD_STAGES, followUpDue, leadStageInfo, type LeadStage } from '@/lib/whatsapp-cloud/lead'
import { chatChannel, type ChatChannel } from '@/lib/instagram/channel'
import { InstagramIcon } from '@/components/shared/instagram-icon'
import { chatInitials, chatName, formatListTime } from './format'

type Filter = 'todos' | 'seguimiento' | LeadStage

/**
 * Bandeja de WhatsApp: lista de chats a la izquierda + chat abierto a la
 * derecha (escritorio). En móvil se ve una cosa a la vez: la lista en
 * /dashboard/inbox y el chat en /dashboard/inbox/[id].
 *
 * La lista viene del servidor; Realtime avisa de cualquier cambio en
 * `wa_conversations` del estudio y se hace `router.refresh()` (trae el
 * nombre del cliente vinculado, que el payload de Realtime no incluye).
 */
export function InboxShell({
  studioId,
  conversations,
  children,
}: {
  studioId: string
  conversations: WaConversation[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const activeId = useSelectedLayoutSegment()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [filter, setFilter] = useState<Filter>('todos')
  const [channelFilter, setChannelFilter] = useState<ChatChannel | 'todos'>('todos')
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    const channel = supabase.channel(`wa-conversations-${studioId}`)

    supabase.realtime.setAuth().then(() => {
      if (cancelled) return
      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wa_conversations', filter: `studio_id=eq.${studioId}` },
          () => {
            // Ráfaga de fotos = varios eventos seguidos: un solo refresh.
            if (refreshTimer.current) clearTimeout(refreshTimer.current)
            refreshTimer.current = setTimeout(() => router.refresh(), 400)
          }
        )
        .subscribe()
    })

    return () => {
      cancelled = true
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      supabase.removeChannel(channel)
    }
  }, [studioId, router])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter((c) => {
      if (c.archived !== showArchived) return false
      if (channelFilter !== 'todos' && chatChannel(c) !== channelFilter) return false
      if (filter === 'seguimiento' ? !c.follow_up_at : filter !== 'todos' && c.lead_stage !== filter) return false
      if (!q) return true
      return [c.client?.name, c.contact_name, c.ig_username, c.wa_id, c.last_message_preview]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    })
  }, [conversations, query, showArchived, filter, channelFilter])
  // Recordatorios primero (los vencidos arriba) cuando se filtra por seguimiento.
  const sorted =
    filter === 'seguimiento'
      ? [...visible].sort((a, b) => Date.parse(a.follow_up_at!) - Date.parse(b.follow_up_at!))
      : visible

  const archivedCount = conversations.filter((c) => c.archived).length
  // El selector de canal solo aparece cuando ya hay chats de Instagram.
  const hasInstagram = conversations.some((c) => chatChannel(c) === 'instagram')
  const inbox = conversations.filter(
    (c) => c.archived === showArchived && (channelFilter === 'todos' || chatChannel(c) === channelFilter)
  )
  const dueCount = inbox.filter((c) => followUpDue(c.follow_up_at)).length
  const filters: { key: Filter; label: string; count: number; dot?: string }[] = [
    { key: 'todos', label: 'Todos', count: inbox.length },
    { key: 'seguimiento', label: 'Seguimiento', count: inbox.filter((c) => c.follow_up_at).length },
    ...LEAD_STAGES.map((st) => ({
      key: st.key,
      label: st.short,
      dot: st.dot,
      count: inbox.filter((c) => c.lead_stage === st.key).length,
    })),
  ]

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100dvh-12.5rem)] overflow-hidden border-border/60 bg-card sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border lg:h-[calc(100dvh-4rem)]">
      <aside
        className={cn(
          'flex w-full shrink-0 flex-col border-border/60 lg:w-[340px] lg:border-r',
          activeId && 'hidden lg:flex'
        )}
      >
        <div className="space-y-2 border-b border-border/60 p-3">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 font-display text-base font-semibold">
              {showArchived ? 'Archivados' : 'Mensajes'}
              {dueCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter('seguimiento')}
                  className="flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive"
                  title="Chats con seguimiento pendiente"
                >
                  <BellRing className="size-3" />
                  {dueCount}
                </button>
              )}
            </h1>
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard/inbox/campaigns"
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-accent/60 hover:text-foreground',
                  activeId === 'campaigns' ? 'bg-accent/70 text-foreground' : 'text-muted-foreground'
                )}
              >
                <Megaphone className="size-3.5" />
                Campañas
              </Link>
              {(archivedCount > 0 || showArchived) && (
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                >
                  <Archive className="size-3.5" />
                  {showArchived ? 'Ver bandeja' : `Archivados (${archivedCount})`}
                </button>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar chat o cliente"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          {hasInstagram && (
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {(
                [
                  { key: 'todos', label: 'Todos' },
                  { key: 'whatsapp', label: 'WhatsApp' },
                  { key: 'instagram', label: 'Instagram' },
                ] as const
              ).map((ch) => (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => setChannelFilter(ch.key)}
                  aria-pressed={channelFilter === ch.key}
                  className={cn(
                    'flex h-7 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors',
                    channelFilter === ch.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {ch.key === 'whatsapp' && <MessageCircle className="size-3.5" />}
                  {ch.key === 'instagram' && <InstagramIcon className="size-3.5" />}
                  {ch.label}
                </button>
              ))}
            </div>
          )}
          {/* Filtros por etapa del lead. */}
          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none]">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  'flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {f.key === 'seguimiento' ? (
                  <BellRing className="size-3" />
                ) : (
                  f.dot && <span className={cn('size-1.5 rounded-full', f.dot)} />
                )}
                {f.label}
                {f.count > 0 && <span className="tabular-nums opacity-60">{f.count}</span>}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">
              {conversations.length === 0
                ? 'Aún no hay chats. Cuando un cliente te escriba por WhatsApp o Instagram, aparecerá aquí.'
                : filter !== 'todos'
                  ? 'No hay chats en esta etapa.'
                  : 'Sin resultados.'}
            </li>
          ) : (
            sorted.map((c) => {
              const name = chatName(c)
              const instagram = chatChannel(c) === 'instagram'
              const stage = leadStageInfo(c.lead_stage)
              const due = followUpDue(c.follow_up_at)
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/inbox/${c.id}`}
                    className={cn(
                      'flex items-center gap-3 border-b border-border/40 px-3 py-3 transition-colors hover:bg-accent/50',
                      activeId === c.id && 'bg-accent/70'
                    )}
                  >
                    <span className="relative shrink-0">
                      <span className="grid size-10 place-items-center rounded-full bg-primary/15 font-display text-sm font-semibold text-primary">
                        {chatInitials(name.replace(/^@/, ''))}
                      </span>
                      {/* Canal del chat. */}
                      <span
                        className={cn(
                          'absolute -right-0.5 -bottom-0.5 grid size-4.5 place-items-center rounded-full text-white ring-2 ring-card',
                          instagram ? 'bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600' : 'bg-emerald-500'
                        )}
                        title={instagram ? 'Instagram' : 'WhatsApp'}
                      >
                        {instagram ? <InstagramIcon className="size-2.5" /> : <MessageCircle className="size-2.5" />}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn('truncate text-sm', c.unread_count > 0 ? 'font-semibold' : 'font-medium')}>
                          {name}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 text-[12px] tabular-nums',
                            c.unread_count > 0 ? 'text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {formatListTime(c.last_message_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {c.last_message_direction === 'out' ? 'Tú: ' : ''}
                          {c.last_message_preview || '…'}
                        </span>
                        {c.unread_count > 0 && (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[12px] font-bold text-primary-foreground">
                            {c.unread_count}
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', stage.chip)}>
                          <span className={cn('size-1.5 rounded-full', stage.dot)} />
                          {stage.short}
                        </span>
                        {c.follow_up_at && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                              due ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'
                            )}
                          >
                            <BellRing className="size-3" />
                            {due ? 'Pendiente' : formatListTime(c.follow_up_at)}
                          </span>
                        )}
                        {!c.client && !c.answered_from_phone && (
                          <span className="text-[11px] text-muted-foreground">Sin guardar</span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })
          )}
        </ul>
      </aside>

      <section className={cn('min-w-0 flex-1', !activeId && 'hidden lg:flex')}>{children}</section>
    </div>
  )
}
