'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { ZoomIn } from 'lucide-react'
import { Icon3D } from '@/components/ui/icon-3d'
import { GalleryLightbox, type LightboxPhoto } from '@/components/gallery/gallery-lightbox'

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
  children,
}: {
  projectName: string
  gallery: LightboxPhoto[]
  /** Id de la foto que se muestra como portada -- el visor abre en su índice. */
  coverPhotoId: string | null
  /** Título y datos que van encima de la foto, sobre el degradado. */
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const cover = coverPhotoId ? gallery.find((g) => g.id === coverPhotoId) : null
  const openIndex = cover ? gallery.findIndex((g) => g.id === cover.id) : 0

  return (
    <div className="tile-slate relative aspect-[4/3] overflow-hidden rounded-[2rem] text-white sm:aspect-[16/9]">
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
          <span className="absolute top-3 right-3 grid size-10 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md">
            <ZoomIn className="size-4" strokeWidth={2} />
          </span>
        </button>
      ) : (
        <Icon3D name="framed-picture" className="absolute top-8 left-1/2 size-24 -translate-x-1/2 opacity-90" />
      )}

      {children && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pt-16 pb-5">
          {children}
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
