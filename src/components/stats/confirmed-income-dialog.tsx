'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Calendar, Wallet } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cop } from '@/lib/projects/metrics'
import { updatePaymentDateAction, deletePaymentAction } from '@/actions/payments'
import type { MonthPayment } from '@/lib/stats/period-metrics'

function PaymentRow({
  payment,
  onUpdate,
}: {
  payment: MonthPayment
  onUpdate: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [date, setDate] = React.useState(payment.paid_at)
  const [loading, setLoading] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  async function handleUpdateDate() {
    if (date === payment.paid_at) {
      setEditing(false)
      return
    }
    setLoading(true)
    const result = await updatePaymentDateAction({
      payment_id: payment.id,
      paid_at: date,
    })
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Fecha actualizada')
    setEditing(false)
    onUpdate()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este pago? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    const result = await deletePaymentAction({ payment_id: payment.id })
    setDeleting(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Pago eliminado')
    onUpdate()
  }

  const formattedDate = new Date(payment.paid_at + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{payment.client_name}</p>
        <p className="text-xs text-muted-foreground truncate">{payment.project_name}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold tabular-nums">{cop(payment.amount)}</p>
        {editing ? (
          <div className="flex items-center gap-1 mt-1">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 w-32 text-xs"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={handleUpdateDate}
              disabled={loading}
            >
              {loading ? '...' : 'Ok'}
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Calendar className="size-3" />
            {formattedDate}
          </button>
        )}
      </div>

      <Button
        size="icon-sm"
        variant="ghost"
        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Eliminar</span>
      </Button>
    </div>
  )
}

export function ConfirmedIncomeDialog({
  payments,
  total,
  monthKey,
  children,
}: {
  payments: MonthPayment[]
  total: number
  monthKey: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const monthLabel = new Date(monthKey + '-01T12:00:00').toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })

  function handleUpdate() {
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" className="text-left w-full" />}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Ingresos de {monthLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b mb-2">
          <span className="text-sm text-muted-foreground">
            {payments.length} {payments.length === 1 ? 'pago' : 'pagos'}
          </span>
          <span className="font-semibold">{cop(total)}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-4 px-4">
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay pagos registrados este mes
            </p>
          ) : (
            payments.map((p) => (
              <PaymentRow key={p.id} payment={p} onUpdate={handleUpdate} />
            ))
          )}
        </div>

        <div className="-mx-4 -mb-4 flex justify-end rounded-b-xl border-t bg-muted/50 p-4">
          <DialogClose render={<Button variant="outline" />}>Cerrar</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
