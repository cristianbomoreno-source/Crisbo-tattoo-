'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LOST_REASONS } from '@/lib/crm/options'

/** "¿Por qué se perdió?" al pasar un lead a Perdido (embudo o barra del chat).
 * El motivo queda como etiqueta del cliente y alimenta las estadísticas. */
export function LostReasonDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (reason: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Por qué se perdió?</DialogTitle>
          <DialogDescription>Así sabes qué te está haciendo perder clientes.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {LOST_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onPick(r)}
              className="min-h-12 rounded-2xl bg-foreground/[0.07] px-3 text-[1.0625rem] font-semibold transition-transform duration-150 ease-out active:scale-95"
            >
              {r}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
