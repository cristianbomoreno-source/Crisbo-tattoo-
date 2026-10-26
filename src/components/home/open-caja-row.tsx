'use client'

import { ChevronRight, Wallet } from 'lucide-react'
import { cop } from '@/lib/projects/metrics'
import { cn } from '@/lib/utils'

export const OPEN_CAJA_EVENT = 'crisbo:open-caja'

/** Entrada visible al Resumen de caja en Inicio (además del gesto ← y la
 * pestañita del borde): la caja se revisa a diario, no debe ser un secreto. */
export function OpenCajaRow({ total, accounts }: { total: number; accounts: number }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CAJA_EVENT))}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left transition-colors active:bg-muted/60"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground/80">
        <Wallet className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-tight">Caja y cuentas</span>
        <span className="block text-[13px] text-muted-foreground">
          {accounts} {accounts === 1 ? 'cuenta' : 'cuentas'} · movimientos y gastos fijos
        </span>
      </span>
      <span className={cn('shrink-0 font-semibold tabular-nums', total < 0 && 'text-destructive')}>{cop(total)}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}
