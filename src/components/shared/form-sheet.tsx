'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Hoja de formulario responsive: en móvil sube desde abajo (drawer/bottom sheet),
 * en desktop (sm+) se centra como diálogo. Reutilizable para los formularios de
 * creación. `children` recibe `close` para cerrar tras un guardado exitoso.
 */
export function FormSheet({
  triggerLabel,
  trigger,
  title,
  description,
  /** Header completamente custom (ilustración, título grande, etc.) — si se
   * pasa, reemplaza visualmente al bloque de título/descripción por
   * defecto (el botón cerrar se sigue renderizando igual). `title`/
   * `description` se siguen usando como nombre accesible del diálogo (Base
   * UI los requiere), solo quedan visualmente ocultos. No afecta a ningún
   * otro FormSheet existente: por defecto sigue igual que siempre. */
  header,
  closeButtonClassName,
  popupClassName,
  children,
}: {
  triggerLabel?: string
  trigger?: React.ReactElement
  title: string
  description?: string
  header?: React.ReactNode
  closeButtonClassName?: string
  popupClassName?: string
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const close = React.useCallback(() => {
    setOpen(false)
    router.refresh()
  }, [router])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger render={trigger ?? <Button>{triggerLabel}</Button>} />
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/40 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none"
        />
        <DialogPrimitive.Popup
          className={cn(
            // Móvil: hoja inferior. Alto máximo y padding respetan el notch/home
            // indicator (safe-area) para que el contenido y el botón de guardar
            // nunca queden cortados por la isla dinámica o la barra inferior.
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(90vh-env(safe-area-inset-bottom))] w-full flex-col gap-4 overflow-y-auto rounded-t-2xl bg-popover p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-popover-foreground ring-1 ring-foreground/10 outline-none',
            'duration-200 data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:slide-in-from-bottom-6 data-closed:slide-out-to-bottom-6 motion-reduce:animate-none',
            // Desktop: diálogo centrado (sin restricciones de safe-area)
            'sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-6 sm:pt-6 sm:pb-6 sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-95 sm:data-closed:zoom-out-95',
            popupClassName
          )}
        >
          {header ? (
            <div className="relative">
              <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>}
              <DialogPrimitive.Close
                render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar" className={cn('absolute top-0 right-0', closeButtonClassName)} />}
              >
                <XIcon />
              </DialogPrimitive.Close>
              {header}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <DialogPrimitive.Title className="font-heading text-lg leading-none font-medium">
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close
                render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar" />}
              >
                <XIcon />
              </DialogPrimitive.Close>
            </div>
          )}
          {children(close)}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
