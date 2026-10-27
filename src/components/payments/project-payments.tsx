'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { deletePaymentAction } from '@/actions/payments'
import { cop } from '@/lib/projects/metrics'
import { cn } from '@/lib/utils'

type Payment = { id: string; amount: number; paid_at: string; payment_method: string | null }

const dateFmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })

/**
 * Abonos del proyecto (ficha completa): cada pago con fecha, cuenta y
 * monto, y "Reversar" para deshacer un ingreso registrado por error — se
 * borra el pago, así que sale del saldo del proyecto, de la caja y de
 * Estadísticas. Pide confirmar en la misma fila.
 */
export function ProjectPayments({ payments }: { payments: Payment[] }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (payments.length === 0) return null
  const sorted = [...payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at))

  function reverse(p: Payment) {
    startTransition(async () => {
      const res = await deletePaymentAction({ payment_id: p.id })
      if (!res.success) {
        toast.error(res.error.message)
        return
      }
      toast.success(`Abono reversado: ${cop(p.amount)}`)
      setConfirming(null)
      router.refresh()
    })
  }

  return (
    <section>
      <h2 className="mb-2 px-1 font-title text-[1.25rem] font-bold tracking-tight">Abonos</h2>
      <ul className="overflow-hidden rounded-[1.25rem] bg-card [&>li+li]:border-t [&>li+li]:border-border">
        {sorted.map((p) => (
          <li key={p.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[1.0625rem] font-semibold tabular-nums">{cop(p.amount)}</span>
                <span className="block text-[13px] text-muted-foreground">
                  {dateFmt.format(new Date(p.paid_at))}
                  {p.payment_method ? ` · ${p.payment_method}` : ''}
                </span>
              </span>
              {confirming !== p.id && (
                <button
                  type="button"
                  onClick={() => setConfirming(p.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary px-3.5 text-[13px] font-semibold active:scale-95"
                >
                  <ArrowCounterClockwise className="size-4" weight="bold" />
                  Reversar
                </button>
              )}
            </div>
            {confirming === p.id && (
              <div className="mt-2.5 space-y-2">
                <p className="text-[13px] text-muted-foreground">Se quita del saldo del proyecto, de la caja y de Estadísticas.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirming(null)} className="h-10 flex-1 rounded-full bg-secondary text-[15px] font-semibold">
                    No
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => reverse(p)}
                    className={cn('h-10 flex-1 rounded-full bg-destructive text-[15px] font-semibold text-white', pending && 'opacity-50')}
                  >
                    {pending ? 'Reversando…' : 'Sí, reversar'}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
