'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, useSelectedLayoutSegment } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { Archive, BellRinging, Kanban, MagnifyingGlass, Megaphone } from '@phosphor-icons/react'
import { LeadPipeline } from './lead-pipeline'
import { visibleTags } from '@/lib/crm/options'
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
  leadValues = {},
  children,
}: {
  studioId: string
  conversations: WaConversation[]
  /** Plata en juego por cliente (queries/crm.ts), para el embudo. */
  leadValues?: Record<string, number>
  children: React.ReactNode
}) {
  const router = useRouter()
  const activeId = useSelectedLayoutSegment()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [filter, setFilter] = useState<Filter>('todos')
  const [channelFilter, setChannelFilter] = useState<ChatChannel | 'todos'>('todos')
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Vista Chats / Embudo en la URL (?vista=embudo).
  const searchParams = useSearchParams()
  const view: 'chats' | 'embudo' = searchParams.get('vista') === 'embudo' ? 'embudo' : 'chats'
  function setView(v: 'chats' | 'embudo') {
    router.replace(v === 'embudo' ? '/dashboard/inbox?vista=embudo' : '/dashboard/inbox')
  }
  // El embudo ocupa toda la pantalla; al abrir un chat o Campañas se ve la lista.
  const showPipeline = view === 'embudo' && !activeId

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

  const header = (
    <div className="space-y-3 px-4 pt-1 pb-3 lg:px-4 lg:pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="large-title flex min-w-0 items-center gap-2 lg:text-[2.125rem]">
          <span className="truncate">{showArchived ? 'Archivados' : 'Mensajes'}</span>
          {dueCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setView('chats')
                setFilter('seguimiento')
              }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[13px] font-bold text-white"
              title="Chats con seguimiento pendiente"
            >
              <BellRinging className="size-3.5" weight="fill" />
              {dueCount}
            </button>
          )}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {(archivedCount > 0 || showArchived) && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              aria-label={showArchived ? 'Ver bandeja' : `Archivados (${archivedCount})`}
              title={showArchived ? 'Ver bandeja' : `Archivados (${archivedCount})`}
              className={cn(
                'grid size-11 place-items-center rounded-full transition-transform duration-150 ease-out active:scale-[0.94]',
                showArchived ? 'bg-primary text-primary-foreground' : 'bg-secondary',
              )}
            >
              <Archive className="size-5" weight="bold" />
            </button>
          )}
          <Link
            href="/dashboard/inbox/campaigns"
            aria-label="Campañas"
            title="Campañas"
            className={cn(
              'grid size-11 place-items-center rounded-full transition-transform duration-150 ease-out active:scale-[0.94]',
              activeId === 'campaigns' ? 'bg-primary text-primary-foreground' : 'bg-secondary',
            )}
          >
            <Megaphone className="size-5" weight="bold" />
          </Link>
        </div>
      </div>

      {/* Chats / Embudo */}
      <div className="grid grid-cols-2 gap-1 rounded-full bg-foreground/[0.07] p-1">
        {(
          [
            ['chats', 'Chats', MessageCircle],
            ['embudo', 'Embudo', Kanban],
          ] as const
        ).map(([v, label, Icon]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={cn(
              'flex h-10 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-[background-color,color] duration-150 ease-out',
              view === v ? 'bg-foreground/15 text-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-[18px]" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )

  if (showPipeline) {
    return (
      <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0">
        {header}
        <LeadPipeline conversations={conversations.filter((c) => !c.archived)} leadValues={leadValues} />
      </div>
    )
  }

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] overflow-hidden sm:mx-0 sm:mt-0 lg:h-[calc(100dvh-4rem)] lg:gap-4">
      <aside
        className={cn(
          'flex w-full shrink-0 flex-col lg:w-[380px] lg:rounded-[2rem] lg:bg-card',
          activeId && 'hidden lg:flex'
        )}
      >
        {header}
        <div className="space-y-2.5 px-4 pb-3">
          <label className="flex h-12 items-center gap-2.5 rounded-full bg-foreground/[0.08] px-4">
            <MagnifyingGlass className="size-5 shrink-0 text-muted-foreground" weight="bold" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar chat o cliente"
              className="w-full bg-transparent text-[1.0625rem] outline-none placeholder:text-muted-foreground"
            />
          </label>
          {hasInstagram && (
            <div className="grid grid-cols-3 gap-1 rounded-full bg-foreground/[0.07] p-1">
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
                    'flex h-9 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold transition-[background-color,color] duration-150 ease-out',
                    channelFilter === ch.key ? 'bg-foreground/15 text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {ch.key === 'instagram' && <InstagramIcon className="size-3.5" />}
                  {ch.label}
                </button>
              ))}
            </div>
          )}
          {/* Filtros por etapa del lead. */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  'flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-95',
                  filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.08] text-foreground'
                )}
              >
                {f.key === 'seguimiento' ? (
                  <BellRinging className="size-4" weight="fill" />
                ) : (
                  f.dot && <span className={cn('size-2 rounded-full', f.dot)} />
                )}
                {f.label}
                {f.count > 0 && <span className="tabular-nums opacity-60">{f.count}</span>}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-2">
          {sorted.length === 0 ? (
            <li className="p-6 text-center text-[15px] text-muted-foreground">
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
              const tag = visibleTags(c.client?.preferred_services)[0]
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/inbox/${c.id}`}
                    className={cn(
                      'flex items-center gap-3 rounded-[1.25rem] px-2 py-2.5 transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] hover:bg-foreground/[0.05]',
                      activeId === c.id && 'bg-foreground/[0.08]'
                    )}
                  >
                    <span className="relative shrink-0">
                      <span className={cn('grid size-14 place-items-center rounded-full text-[1.0625rem] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]', stage.tile)}>
                        {chatInitials(name.replace(/^@/, ''))}
                      </span>
                      {/* Canal del chat. */}
                      <span
                        className={cn(
                          'absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full text-white ring-2 ring-background lg:ring-card',
                          instagram ? 'bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600' : 'bg-income'
                        )}
                        title={instagram ? 'Instagram' : 'WhatsApp'}
                      >
                        {instagram ? <InstagramIcon className="size-3" /> : <MessageCircle className="size-3" />}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn('truncate text-[1.0625rem]', c.unread_count > 0 ? 'font-bold' : 'font-semibold')}>{name}</span>
                        <span
                          className={cn(
                            'shrink-0 text-[13px] tabular-nums',
                            c.unread_count > 0 ? 'font-semibold text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {formatListTime(c.last_message_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={cn('truncate text-[15px]', c.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                          {c.last_message_direction === 'out' ? 'Tú: ' : ''}
                          {c.last_message_preview || '…'}
                        </span>
                        {c.unread_count > 0 && (
                          <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[13px] font-bold text-primary-foreground">
                            {c.unread_count}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 overflow-hidden">
                        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold', stage.chip)}>
                          {stage.short}
                        </span>
                        {c.follow_up_at && (
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold',
                              due ? 'bg-destructive/15 text-destructive' : 'bg-foreground/[0.08] text-muted-foreground'
                            )}
                          >
                            <BellRinging className="size-3" weight="fill" />
                            {due ? 'Pendiente' : formatListTime(c.follow_up_at)}
                          </span>
                        )}
                        {tag && (
                          <span className="truncate rounded-full bg-foreground/[0.08] px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
                            {tag}
                          </span>
                        )}
                        {!c.client && !c.answered_from_phone && (
                          <span className="shrink-0 text-[12px] text-muted-foreground">Sin guardar</span>
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

      <section className={cn('min-w-0 flex-1 overflow-hidden bg-background lg:rounded-[2rem] lg:bg-card', !activeId && 'hidden lg:flex')}>{children}</section>
    </div>
  )
}
