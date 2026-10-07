'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { toast } from 'sonner'
import { Images, ChevronRight, Download, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GalleryUpload } from '@/components/gallery/gallery-upload'
import { GalleryLightbox } from '@/components/gallery/gallery-lightbox'
import { deleteGalleryItemAction } from '@/actions/gallery'

const GALLERY_TYPE_LABELS: Record<string, string> = {
  reference: 'Referencia',
  design: 'Diseño',
  progress: 'Progreso',
  final: 'Final',
}

type GalleryItem = {
  id: string
  url: string
  type: string
  caption: string | null
  storage_path: string
}

/** Tarjeta compacta "Galería" (estilo Resumen del día de Inicio): previsualización
 * en miniatura + tocar cualquier parte abre el grid completo y el botón de
 * subir foto en un popup, en vez de mostrar todo siempre desplegado. */
export function GalleryCard({
  projectId,
  gallery,
  projectName,
}: {
  projectId: string
  gallery: GalleryItem[]
  projectName: string
}) {
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const router = useRouter()
  const preview = gallery.slice(0, 3)

  async function handleDelete(g: GalleryItem) {
    setDeletingId(g.id)
    const result = await deleteGalleryItemAction(g.id, g.storage_path)
    setDeletingId(null)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Foto eliminada')
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 rounded-[1.75rem] bg-card p-5 text-left transition-colors hover:bg-card/80 sm:p-6"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Images className="size-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">Galería</span>
          <span className="block text-sm text-muted-foreground">
            {gallery.length === 0 ? 'Sin fotos todavía' : `${gallery.length} foto${gallery.length === 1 ? '' : 's'}`}
          </span>
        </span>
        {preview.length > 0 && (
          <span className="isolate flex shrink-0 -space-x-2.5">
            {preview.map((g) => (
              <span
                key={g.id}
                className="relative size-9 overflow-hidden rounded-full ring-2 ring-card"
              >
                <NextImage src={g.url} alt="" fill className="object-cover" sizes="36px" />
              </span>
            ))}
          </span>
        )}
        <ChevronRight className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={2} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Galería del proyecto</DialogTitle>
          </DialogHeader>

          {gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5">
              {gallery.map((g, i) => (
                <figure key={g.id} className="relative aspect-square overflow-hidden rounded-2xl bg-background">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    aria-label="Ver foto en grande"
                    className="absolute inset-0 z-0"
                  >
                    <NextImage
                      src={g.url}
                      alt={g.caption ?? projectName}
                      fill
                      className="object-cover"
                      sizes="33vw"
                    />
                  </button>
                  <span
                    className={
                      g.type === 'reference'
                        ? 'absolute bottom-1.5 left-1.5 z-10 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground'
                        : 'absolute bottom-1.5 left-1.5 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground'
                    }
                  >
                    {GALLERY_TYPE_LABELS[g.type] ?? g.type}
                  </span>
                  {g.type === 'reference' && (
                    <a
                      href={g.url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Descargar referencia"
                      className="absolute top-1.5 right-1.5 z-10 grid size-6 place-items-center rounded-full bg-background/90 text-foreground"
                    >
                      <Download className="size-3" strokeWidth={1.8} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(g)
                    }}
                    disabled={deletingId === g.id}
                    aria-label="Eliminar foto"
                    className="absolute top-1.5 left-1.5 z-10 grid size-6 place-items-center rounded-full bg-background/90 text-foreground transition-colors hover:bg-destructive/80 disabled:opacity-50"
                  >
                    <X className="size-3" strokeWidth={2} />
                  </button>
                </figure>
              ))}
            </div>
          )}

          <GalleryUpload projectId={projectId} />
        </DialogContent>
      </Dialog>

      <GalleryLightbox
        photos={gallery}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  )
}
