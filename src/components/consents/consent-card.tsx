'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, Trash2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteConsentAction } from '@/actions/consent-links'
import { formatSessionDate } from '@/lib/projects/metrics'

/**
 * Fila de /dashboard/consents: tocar el nombre abre el PDF completo
 * (/api/consent-links/{linkId}/pdf, ahora `inline` para verse en el
 * navegador en vez de descargarse) y el ícono de basura borra el
 * consentimiento (y su link) tras confirmar — el proyecto queda libre para
 * generar uno nuevo.
 */
export function ConsentCard({
  id,
  linkId,
  projectName,
  clientName,
  signedAt,
}: {
  id: string
  linkId: string | null
  projectName: string
  clientName: string
  signedAt: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function confirmDelete() {
    setLoading(true)
    const result = await deleteConsentAction(id)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Consentimiento eliminado')
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Link
          href={linkId ? `/api/consent-links/${linkId}/pdf` : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
            <FileText className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{projectName}</span>
            <span className="block truncate text-sm text-muted-foreground">{clientName}</span>
            {signedAt && (
              <span className="block text-xs text-muted-foreground">
                Firmado el {formatSessionDate(new Date(signedAt))}
              </span>
            )}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Badge>Firmado</Badge>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Eliminar consentimiento"
                  className="size-9 rounded-full"
                >
                  <Trash2 className="size-4" strokeWidth={2} />
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar consentimiento</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                ¿Seguro que quieres eliminar el consentimiento de «{clientName}»
                {projectName ? ` (${projectName})` : ''}? El proyecto quedará sin
                consentimiento firmado — vas a poder generar uno nuevo. Esta acción
                no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="outline" size="sm">Cancelar</Button>} />
                <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={loading}>
                  {loading ? 'Eliminando…' : 'Eliminar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
