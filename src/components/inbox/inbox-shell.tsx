'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegment } from 'next/navigation'
import { Archive, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { WaConversation } from '@/queries/whatsapp'
import { formatListTime, formatWaPhone } from './format'

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
      if (!q) return true
      return [c.client?.name, c.contact_name, c.wa_id, c.last_message_preview]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    })
  }, [conversations, query, showArchived])

  const archivedCount = conversations.filter((c) => c.archived).length

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
            <h1 className="font-display text-sm font-semibold uppercase tracking-[0.12em]">
              {showArchived ? 'Archivados' : 'Mensajes'}
            </h1>
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
          <label className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar chat o cliente"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">
              {conversations.length === 0
                ? 'Aún no hay chats. Cuando un cliente le escriba a tu número de WhatsApp, aparecerá aquí.'
                : 'Sin resultados.'}
            </li>
          ) : (
            visible.map((c) => {
              const name = c.client?.name || c.contact_name || formatWaPhone(c.wa_id)
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/inbox/${c.id}`}
                    className={cn(
                      'flex items-center gap-3 border-b border-border/40 px-3 py-3 transition-colors hover:bg-accent/50',
                      activeId === c.id && 'bg-accent/70'
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-sm font-semibold uppercase text-primary">
                      {name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2) || '#'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn('truncate text-sm', c.unread_count > 0 ? 'font-semibold' : 'font-medium')}>
                          {name}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 text-[11px] tabular-nums',
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
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                            {c.unread_count}
                          </span>
                        )}
                      </span>
                      {!c.client && !c.answered_from_phone && (
                        <span className="mt-1 inline-block rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-400">
                          Nuevo contacto
                        </span>
                      )}
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
