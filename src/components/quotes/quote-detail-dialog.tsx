'use client'

import { motion, useDragControls, type PanInfo } from 'motion/react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { QuoteDetailContent } from '@/components/quotes/quote-detail-content'
import type { QuoteWithClient } from '@/queries/quotes'

export type QuoteForDialog = QuoteWithClient & {
  photoUrl: string | null
  referencePhotos: string[]
  projectId?: string | null
}

/** Franja "agarradera" arriba de la foto: se desliza hacia abajo para
 *  cerrar el popup (patrón bottom-sheet). Solo esta franja escucha el
 *  gesto (`dragListener={false}` + `dragControls`) para no interferir con
 *  el scroll normal del contenido. */
function DragToClose({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const controls = useDragControls()

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose()
  }

  return (
    <motion.div
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={handleDragEnd}
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="absolute inset-x-0 top-0 z-10 flex touch-none justify-center py-2.5"
        aria-hidden="true"
      >
        <span className="h-1.5 w-10 rounded-full bg-white/40" />
      </div>
      {children}
    </motion.div>
  )
}

/**
 * Popup de detalle de cotización — se abre al tocar cualquier tarjeta de la
 * lista (quotes-list.tsx ya no navega a una página). Mismo patrón que
 * project-detail-dialog.tsx: estado `selected` en el componente cliente
 * padre, `null` = cerrado. La X por defecto del Dialog se desactiva porque
 * quedaba superpuesta con el botón de eliminar (ver quote-detail-content.tsx,
 * que trae su propia X junto al de eliminar) — y se agrega deslizar hacia
 * abajo para cerrar.
 */
export function QuoteDetailDialog({
  quote,
  quoteMessageTemplate,
  depositMode,
  depositValue,
  onClose,
}: {
  quote: QuoteForDialog | null
  quoteMessageTemplate?: string | null
  depositMode?: string | null
  depositValue?: number | null
  onClose: () => void
}) {
  const open = quote !== null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {quote && (
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] w-full max-w-md gap-0 overflow-y-auto rounded-3xl border-0 p-0 sm:max-w-lg"
        >
          {/* Título accesible para el lector de pantalla: el nombre visual
              (enorme, en la foto) ya cumple esta función para todos los
              demás — DialogTitle es requerido por Base UI pero no necesita
              duplicarse visualmente. */}
          <DialogTitle className="sr-only">
            Cotización de {quote.clients?.name ?? 'cliente'}
          </DialogTitle>
          <DragToClose onClose={onClose}>
            <QuoteDetailContent
              quote={quote}
              photoUrl={quote.photoUrl}
              referencePhotos={quote.referencePhotos}
              quoteMessageTemplate={quoteMessageTemplate}
              depositMode={depositMode}
              depositValue={depositValue}
              projectId={quote.projectId}
              onAfterAction={onClose}
              onClose={onClose}
            />
          </DragToClose>
        </DialogContent>
      )}
    </Dialog>
  )
}
