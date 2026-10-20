'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarClock, Hourglass, Loader2, Send, X } from 'lucide-react'
import { cancelCampaign, sendCampaignNow } from '@/actions/custom-campaigns'
import { COST_PER_MESSAGE, STATUS_LABEL, type CampaignStatus } from '@/lib/campaigns/custom'
import { cop } from '@/lib/projects/metrics'

/** Estado de una campaña creada desde la app, con "Enviar ahora" y "Cancelar". */
export function CustomCampaignBanner({
  id,
  status,
  scheduledAt,
  planned,
  cursor,
  sentCount,
  failedCount,
  templateName,
}: {
  id: string
  status: CampaignStatus
  scheduledAt: string | null
  planned: number
  cursor: number
  sentCount: number
  failedCount: number
  templateName: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const future = scheduledAt && new Date(scheduledAt) > new Date()
  const when = scheduledAt
    ? new Date(scheduledAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'full', timeStyle: 'short' })
    : null

  function run(fn: () => Promise<{ success: boolean; error?: { message: string } }>, okMsg: string) {
    start(async () => {
      const res = await fn()
      if (!res.success) return void toast.error(res.error?.message ?? 'Error')
      toast.success(okMsg)
      router.refresh()
    })
  }

  const text =
    status === 'awaiting_template'
      ? `Meta está revisando la plantilla "${templateName}". Te llega una notificación cuando la aprueben y la campaña sale ${future ? `el ${when}` : 'de una vez'}.`
      : status === 'scheduled'
        ? future
          ? `Sale el ${when} a ${planned} personas (≈ ${cop(planned * COST_PER_MESSAGE)}).`
          : `Arrancando el envío a ${planned} personas…`
        : status === 'sending'
          ? `Enviando: ${cursor} de ${planned} procesados (${sentCount} enviados). Sale por tandas de 250 cada 5 minutos.`
          : status === 'sent'
            ? `Enviada a ${sentCount} de ${planned} personas${failedCount ? ` · ${failedCount} no se pudieron enviar` : ''}.`
            : 'Esta campaña está cancelada: no se envía nada más.'

  const Icon = status === 'awaiting_template' ? Hourglass : CalendarClock

  return (
    <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-primary">{STATUS_LABEL[status]}</p>
          <p className="text-sm">{text}</p>
        </div>
      </div>
      {(status === 'scheduled' || status === 'awaiting_template' || status === 'sending') && (
        <div className="flex flex-wrap gap-2">
          {status === 'scheduled' && future && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => sendCampaignNow(id), 'Enviando…')}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Enviar ahora
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => cancelCampaign(id), 'Campaña cancelada')}
            className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            <X className="size-3.5" />
            {status === 'sending' ? 'Detener envío' : 'Cancelar campaña'}
          </button>
        </div>
      )}
    </div>
  )
}
