'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Gift, Megaphone, MessageCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CAMPAIGN_GROUPS, timeAwayLabel, type CampaignGroup } from '@/lib/campaigns/audience'
import type { CampaignRecipient } from '@/queries/campaigns'

type Tab = 'todos' | CampaignGroup

/** Campaña "Segundo capítulo": lista de clientes que la reciben. */
export function CampaignView({ recipients, error }: { recipients: CampaignRecipient[]; error: string | null }) {
  const [tab, setTab] = useState<Tab>('todos')
  const [query, setQuery] = useState('')

  const counts = {
    todos: recipients.length,
    A: recipients.filter((r) => r.group === 'A').length,
    B: recipients.filter((r) => r.group === 'B').length,
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipients.filter(
      (r) => (tab === 'todos' || r.group === tab) && (!q || r.name.toLowerCase().includes(q) || r.phone.includes(q))
    )
  }, [recipients, tab, query])

  async function copyList() {
    const text = visible.map((r) => `${r.firstName}\t${r.phone}\t${CAMPAIGN_GROUPS[r.group].label}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${visible.length} clientes copiados`)
    } catch {
      toast.error('No se pudo copiar la lista')
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link
          href="/dashboard/inbox"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 lg:hidden"
          aria-label="Volver a los chats"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-sm font-semibold">Campaña “Segundo capítulo”</h2>
          <p className="truncate text-xs text-muted-foreground">{counts.todos} clientes · hasta el 3 de noviembre</p>
        </div>
        <button
          type="button"
          onClick={copyList}
          disabled={visible.length === 0}
          className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          <Copy className="size-3.5" />
          Copiar
        </button>
      </header>

      <div className="space-y-3 border-b border-border/60 p-3 sm:px-4">
        <div className="flex gap-3 rounded-xl bg-primary/10 p-3 text-xs">
          <Gift className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Tatuaje hasta 20 cm en blanco y negro por $460.000</span> + un
            tatuaje minimalista de regalo. Solo 15 cupos. No incluye clientes con cita agendada ni que se tatuaron en
            el último mes.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {(['todos', 'A', 'B'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              title={key === 'todos' ? undefined : CAMPAIGN_GROUPS[key].hint}
              className={cn(
                'rounded-lg py-1.5 text-xs font-medium transition-colors',
                tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {key === 'todos' ? 'Todos' : CAMPAIGN_GROUPS[key].label} ({counts[key]})
            </button>
          ))}
        </div>
        {tab !== 'todos' && <p className="text-xs text-muted-foreground">{CAMPAIGN_GROUPS[tab].hint}</p>}
        <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente o número"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <ul className="flex-1 divide-y divide-border/60 overflow-y-auto">
        {error && <li className="p-6 text-center text-sm text-destructive">No se pudo cargar la lista: {error}</li>}
        {!error && visible.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">No hay clientes en esta lista.</li>
        )}
        {visible.map((r) => (
          <li key={r.clientId} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
              {r.firstName.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {r.firstName}
                <span className="ml-1.5 font-normal text-muted-foreground">{r.name}</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {r.phone} · última visita {timeAwayLabel(r.lastVisit)}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                r.group === 'A' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {r.group}
            </span>
            {r.conversationId ? (
              <Link
                href={`/dashboard/inbox/${r.conversationId}`}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                aria-label={`Abrir chat con ${r.firstName}`}
              >
                <MessageCircle className="size-4" />
              </Link>
            ) : (
              <Link
                href={`/dashboard/clients/${r.clientId}`}
                className="shrink-0 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                Ficha
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
