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
import { deleteProjectAction } from '@/actions/projects'

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function confirmDelete() {
    setLoading(true)
    const result = await deleteProjectAction(projectId)
    if (!result.success) {
      setLoading(false)
      toast.error(result.error.message)
      return
    }
    toast.success('Proyecto eliminado')
    router.push('/dashboard/projects')
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="secondary"
            size="icon"
            aria-label="Eliminar proyecto"
            className="size-10 rounded-full"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar proyecto</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar «{projectName}»? Se borrarán sus sesiones,
          pagos y consentimientos. Esta acción no se puede deshacer.
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
