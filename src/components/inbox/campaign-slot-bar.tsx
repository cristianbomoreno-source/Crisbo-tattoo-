'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Megaphone, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setCampaignSlot } from '@/actions/campaigns'
import { CAMPAIGN_NAME, CAMPAIGN_SLOTS } from '@/lib/campaigns/nuevos-trazos'
import type { CampaignChatInfo } from '@/queries/campaigns'

/** Barra del chat para clientes de la campaña: marcar que pagó el abono y
 * tomó un cupo, con el contador de cupos del estudio. */
export function CampaignSlotBar({ info }: { info: CampaignChatInfo }) {
  const [taken, setTaken] = useState(info.slotTaken)
  const [count, setCount] = useState(info.slotsTaken)
  const [pending, startTransition] = useTransition()
  const left = CAMPAIGN_SLOTS - count

  function toggle() {
    startTransition(async () => {
      const res = await setCampaignSlot(info.clientId, !taken)
      if (!res.success) return void toast.error(res.error.message)
      setTaken(!taken)
      setCount(res.data.slotsTaken)
      toast.success(!taken ? `Cupo tomado · quedan ${CAMPAIGN_SLOTS - res.data.slotsTaken}` : 'Cupo liberado')
    })
  }

  return (
    <div className="flex items-center gap-2 border-b border-border/60 bg-primary/5 px-3 py-1.5 text-xs sm:px-4">
      <Megaphone className="size-3.5 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        {CAMPAIGN_NAME} · {left > 0 ? `quedan ${left} de ${CAMPAIGN_SLOTS} cupos` : 'cupos agotados'}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={pending || (!taken && left <= 0)}
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-semibold disabled:opacity-50',
          taken ? 'bg-income text-income-foreground' : 'bg-muted text-foreground hover:bg-accent'
        )}
      >
        <Ticket className="size-3.5" />
        {taken ? 'Cupo tomado' : 'Marcar cupo tomado'}
      </button>
    </div>
  )
}
