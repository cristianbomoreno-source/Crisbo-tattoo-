'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Wallet } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPaymentAction } from '@/actions/payments'

export function RegisterPaymentDialog({
  projectId,
  balance,
  sessionId,
  triggerLabel = 'Registrar pago',
}: {
  projectId: string
  balance: number
  sessionId?: string
  triggerLabel?: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState(
    !sessionId && balance > 0 ? String(Math.round(balance)) : ''
  )
  const [loading, setLoading] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await createPaymentAction({ project_id: projectId, session_id: sessionId, amount })
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Pago registrado')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="secondary"
            className="h-auto w-full justify-start gap-2.5 rounded-2xl px-4 py-4 text-sm font-semibold"
          >
            <Wallet className="size-4.5" strokeWidth={2} />
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto (COP)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
            {balance > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                Saldo pendiente: ${Math.round(balance).toLocaleString('es-CO')}
              </p>
            )}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Guardando…' : 'Registrar pago'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
