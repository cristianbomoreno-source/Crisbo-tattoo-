'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { ZoomIn, Image as ImageIcon } from 'lucide-react'
import { GalleryLightbox, type LightboxPhoto } from '@/components/gallery/gallery-lightbox'

const photoTexture: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, var(--muted) 0 11px, var(--card) 11px 22px)',
}

/**
 * Foto de portada del proyecto (encabezado de la ficha completa). Tocar la
 * foto -- no solo el botón de lupa -- abre el visor de galería a pantalla
 * completa, ya posicionado en esta foto, y desde ahí se desliza hacia los
 * lados para ver el resto de fotos del proyecto (si hay más de una).
 */
export function ProjectCoverPhoto({
  projectName,
  gallery,
  coverPhotoId,
}: {
  projectName: string
  gallery: LightboxPhoto[]
  /** Id de la foto que se muestra como portada -- el visor abre en su índice. */
  coverPhotoId: string | null
}) {
  const [open, setOpen] = useState(false)
  const cover = coverPhotoId ? gallery.find((g) => g.id === coverPhotoId) : null
  const openIndex = cover ? gallery.findIndex((g) => g.id === cover.id) : 0

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] bg-card">
      {cover ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ver foto en grande"
          className="absolute inset-0 size-full"
        >
          <NextImage
            src={cover.url}
            alt={projectName}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <span className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur-sm">
            <ZoomIn className="size-4" strokeWidth={2} />
          </span>
        </button>
      ) : (
        <div className="grid h-full place-items-center" style={photoTexture}>
          <ImageIcon className="size-7 text-muted-foreground/25" strokeWidth={1.4} />
        </div>
      )}

      <GalleryLightbox
        photos={gallery}
        openIndex={open ? Math.max(0, openIndex) : null}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}
