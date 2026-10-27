'use client'

import { cop } from '@/lib/projects/metrics'
import { TileRow } from '@/components/ui/tile'

export const OPEN_CAJA_EVENT = 'crisbo:open-caja'

/** Entrada visible al Resumen de caja en Inicio (además del gesto ←): la caja se revisa a diario, no debe ser un secreto.
 * Tarjeta de color como "Logros" de Apple Games. */
export function OpenCajaRow({ total, accounts }: { total: number; accounts: number }) {
  return (
    <TileRow
      tone="teal"
      icon="money-bag"
      onClick={() => window.dispatchEvent(new Event(OPEN_CAJA_EVENT))}
      title="Caja y cuentas"
      subtitle={
        <>
          <span className="font-semibold text-white tabular-nums">{cop(total)}</span> · {accounts} {accounts === 1 ? 'cuenta' : 'cuentas'}
        </>
      }
    />
  )
}
