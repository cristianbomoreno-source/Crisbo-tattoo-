'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { startSessionWithMaterials } from '@/actions/session-materials'
import { cop } from '@/lib/projects/metrics'
import type { InventoryItem } from '@/queries/inventory'

/**
 * Popup de materiales antes de arrancar el cronómetro de UNA cita puntual
 * (botón ▶ en "Próxima sesión" del móvil, o en cada fila de la lista de
 * citas de hoy en el Home de escritorio — mismo componente en los dos).
 *
 * Cada insumo precarga la cantidad configurada como "mínimo por sesión"
 * (Ajustes → Inventario), editable acá mismo para ESTA sesión puntual. Al
 * confirmar: se registra el gasto, se descuenta del inventario, se calcula
 * el valor total (si el insumo tiene costo unitario cargado) y arranca el
 * cronómetro — todo en un solo paso, sin pantallas intermedias.
 */
export function SessionMaterialsDialog({
  open,
  onOpenChange,
  sessionId,
  items,
  onStarted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  items: InventoryItem[]
  onStarted: (shift: { shiftId: string; startedAt: string }) => void
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.default_qty_per_session]))
  )
  const [saving, setSaving] = useState(false)

  const total = items.reduce((sum, i) => {
    const qty = quantities[i.id] ?? 0
    return i.unit_cost != null ? sum + qty * i.unit_cost : sum
  }, 0)

  async function handleStart() {
    setSaving(true)
    const materials = items
      .map((i) => ({ inventoryItemId: i.id, quantity: quantities[i.id] ?? 0 }))
      .filter((m) => m.quantity > 0)
    const result = await startSessionWithMaterials({ sessionId, materials })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Sesión iniciada')
    onStarted(result.data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Materiales de esta sesión</DialogTitle>
          <DialogDescription>
            Confirma cuánto material vas a gastar antes de arrancar el cronómetro — se descuenta del inventario apenas confirmes.
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Todavía no tienes insumos cargados en el inventario.{' '}
            <Link href="/dashboard/settings/inventario" className="text-primary underline">
              Agrégalos aquí
            </Link>{' '}
            — luego vuelves e inicias la sesión.
          </p>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.unit}
                    {item.unit_cost != null ? ` · ${cop(item.unit_cost)} c/u` : ''}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={quantities[item.id] ?? 0}
                  onChange={(e) =>
                    setQuantities((q) => ({ ...q, [item.id]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="w-20 shrink-0 text-center"
                />
              </div>
            ))}
          </div>
        )}

        {total > 0 && (
          <p className="border-t border-border pt-3 text-sm font-semibold">
            Valor en materiales: <span className="text-primary">{cop(total)}</span>
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleStart} disabled={saving}>
            {saving ? 'Iniciando…' : 'Iniciar sesión'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
