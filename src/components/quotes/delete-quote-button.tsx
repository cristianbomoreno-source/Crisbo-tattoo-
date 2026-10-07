'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteQuoteAction } from '@/actions/quotes'
import { cn } from '@/lib/utils'

export function DeleteQuoteButton({
  quoteId,
  quoteLabel,
  className,
  iconOnly = false,
  label = 'Eliminar',
  onDeleted,
}: {
  quoteId: string
  quoteLabel: string
  className?: string
  iconOnly?: boolean
  label?: string
  onDeleted?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function confirmDelete() {
    setLoading(true)
    const result = await deleteQuoteAction(quoteId)
    if (!result.success) {
      setLoading(false)
      toast.error(result.error.message)
      return
    }
    toast.success('Cotización eliminada')
    onDeleted?.()
    router.push('/dashboard/quotes')
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn('text-destructive hover:text-destructive', className)}
            aria-label={iconOnly ? 'Eliminar cotización' : undefined}
          >
            <Trash2 className="size-4" />
            {!iconOnly && label}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar cotización</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar la cotización de «{quoteLabel}»? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <DialogClose render={<Button variant="outline" size="sm">Cancelar</Button>} />
          <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={loading}>
            {loading ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
