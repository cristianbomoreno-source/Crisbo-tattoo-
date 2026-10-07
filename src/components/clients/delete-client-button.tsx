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
import { deleteClientAction } from '@/actions/clients'

export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function confirmDelete() {
    setLoading(true)
    const result = await deleteClientAction(clientId)
    if (!result.success) {
      setLoading(false)
      toast.error(result.error.message)
      return
    }
    toast.success('Cliente eliminado')
    router.push('/dashboard/clients')
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar a «{clientName}»? Esta acción no se puede deshacer.
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
