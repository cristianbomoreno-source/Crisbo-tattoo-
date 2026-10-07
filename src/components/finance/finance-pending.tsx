import { MessageCircle } from 'lucide-react'
import type { PendingRow } from '@/lib/finance/metrics'
import { cop } from '@/lib/projects/metrics'
import { waLink } from '@/lib/whatsapp'
import { buildMessage, DEFAULT_BALANCE_TEMPLATE } from '@/lib/messages/templates'
import { cn } from '@/lib/utils'

const STATUS_DOT: Record<PendingRow['status'], string> = {
  'al-dia': 'bg-primary',
  proximo: 'bg-amber-400',
  vencido: 'bg-red-400',
}
const STATUS_LABEL: Record<PendingRow['status'], string> = {
  'al-dia': 'Al día',
  proximo: 'Próximo a vencer',
  vencido: 'Vencido',
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

export function FinancePendingCard({ rows, template }: { rows: PendingRow[]; template?: string | null }) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-[28px] border border-white/8 bg-card p-5">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Pendientes por cobrar
      </h3>
      <div className="mt-4 flex flex-col gap-2.5">
        {rows.map((r) => {
          const message = buildMessage(template || DEFAULT_BALANCE_TEMPLATE, {
            nombre_cliente: r.clientName,
            saldo: cop(r.balance),
          })
          const link = waLink(r.clientPhone, message)
          return (
            <div key={r.projectId} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 font-heading text-xs text-white">
                {initials(r.clientName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{r.clientName}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn('size-1.5 rounded-full', STATUS_DOT[r.status])} aria-hidden />
                  {STATUS_LABEL[r.status]}
                  {r.dueDate && ` · ${r.dueDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`}
                </p>
              </div>
              <p className="shrink-0 font-display text-sm font-semibold tabular-nums text-white">{cop(r.balance)}</p>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Recordar por WhatsApp a ${r.clientName}`}
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                >
                  <MessageCircle className="size-4" strokeWidth={1.8} aria-hidden />
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
