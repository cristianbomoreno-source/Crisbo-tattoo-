'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, MessageCircle, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CustomRecipient } from '@/queries/custom-campaigns'

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Enviado', className: 'bg-muted text-muted-foreground' },
  delivered: { label: 'Entregado', className: 'bg-transfer/15 text-transfer' },
  read: { label: 'Leído', className: 'bg-income/15 text-income' },
  failed: { label: 'No llegó', className: 'bg-destructive/15 text-destructive' },
}

type Tab = 'todos' | 'respondieron' | 'llego' | 'fallo' | 'pendiente'

/** Clientes de una campaña creada desde la app, con su estado. */
export function CustomCampaignList({ id, name, recipients }: { id: string; name: string; recipients: CustomRecipient[] }) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('todos')
  const counts = useMemo(
    () => ({
      todos: recipients.length,
      respondieron: recipients.filter((r) => r.replied).length,
      llego: recipients.filter((r) => r.status && r.status !== 'failed').length,
      fallo: recipients.filter((r) => r.status === 'failed').length,
      pendiente: recipients.filter((r) => !r.status).length,
    }),
    [recipients]
  )
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return recipients.filter((r) => {
      if (tab === 'respondieron' && !r.replied) return false
      if (tab === 'llego' && !(r.status && r.status !== 'failed')) return false
      if (tab === 'fallo' && r.status !== 'failed') return false
      if (tab === 'pendiente' && r.status) return false
      return !needle || r.name.toLowerCase().includes(needle) || (r.phone ?? '').includes(needle)
    })
  }, [recipients, q, tab])

  function copyList() {
    navigator.clipboard
      .writeText(visible.map((r) => `${r.name}\t${r.phone ?? ''}`).join('\n'))
      .then(() => toast.success(`${visible.length} contactos copiados`))
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'respondieron', label: 'Respondieron' },
    { key: 'llego', label: 'Les llegó' },
    { key: 'fallo', label: 'No llegó' },
    { key: 'pendiente', label: 'Pendientes' },
  ]

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link
          href={`/dashboard/inbox/campaigns/c/${id}`}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60"
          aria-label="Volver a las estadísticas"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Users className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-sm font-semibold">{name}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {counts.todos} clientes · {counts.llego} les llegó · {counts.respondieron} respondieron
          </p>
        </div>
        <button
          type="button"
          onClick={copyList}
          disabled={!visible.length}
          className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          <Copy className="size-3.5" />
          Copiar
        </button>
      </header>

      <div className="space-y-2 border-b border-border/60 p-3 sm:px-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className="h-10 w-full rounded-xl border border-input bg-transparent pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                tab === t.key ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {t.label} {counts[t.key]}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 divide-y divide-border/60 overflow-y-auto">
        {visible.map((r) => {
          const st = STATUS[r.status ?? 'pending'] ?? STATUS.pending!
          return (
            <li key={r.clientId} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.phone}
                  {r.status === 'failed' && r.error ? ` · ${r.error.slice(0, 60)}` : ''}
                </p>
              </div>
              {r.replied && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">Respondió</span>
              )}
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', st.className)}>{st.label}</span>
              {r.conversationId && (
                <Link
                  href={`/dashboard/inbox/${r.conversationId}`}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                  aria-label={`Abrir chat de ${r.name}`}
                >
                  <MessageCircle className="size-4" />
                </Link>
              )}
            </li>
          )
        })}
        {!visible.length && <li className="p-6 text-center text-sm text-muted-foreground">Nadie en esta lista.</li>}
      </ul>
    </div>
  )
}
