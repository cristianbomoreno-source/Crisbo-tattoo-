'use client'

import { useMemo, useState } from 'react'

/**
 * <img> para fotos remotas de Supabase Storage optimizado para listas.
 *
 * El problema real de carga de la app: las tarjetas (cotizaciones, proyectos,
 * próxima sesión) mostraban la foto ORIGINAL subida desde el celular — 2 a
 * 8 MB cada una — así que abrir una lista descargaba decenas de MB. Este
 * componente pide en su lugar la miniatura del CDN de transformación de
 * Supabase (`/render/image/public/...?width&quality`), que pesa 50–150 KB.
 *
 * Fallback automático: si el proyecto de Supabase no tiene habilitadas las
 * transformaciones de imagen (es función de planes pagos), esa URL responde
 * error → `onError` cambia una sola vez a la URL original y todo se ve igual
 * que antes. Cero configuración, no puede romper nada.
 *
 * Además siempre marca `loading="lazy"` + `decoding="async"`: las tarjetas
 * fuera de pantalla no descargan su foto hasta acercarse al viewport.
 */
export function RemotePhoto({
  src,
  width = 800,
  quality = 70,
  alt = '',
  className,
  eager = false,
}: {
  src: string
  /** Ancho máximo de la miniatura pedida al CDN (px). */
  width?: number
  quality?: number
  alt?: string
  className?: string
  /** true para imágenes above-the-fold que deben cargar de inmediato. */
  eager?: boolean
}) {
  const thumbSrc = useMemo(() => {
    const marker = '/storage/v1/object/public/'
    if (!src.includes(marker)) return null
    try {
      const url = new URL(src.replace(marker, '/storage/v1/render/image/public/'))
      url.searchParams.set('width', String(width))
      url.searchParams.set('quality', String(quality))
      url.searchParams.set('resize', 'contain')
      return url.toString()
    } catch {
      return null
    }
  }, [src, width, quality])

  const [failed, setFailed] = useState(false)
  const effectiveSrc = thumbSrc && !failed ? thumbSrc : src

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={effectiveSrc}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (!failed && thumbSrc) setFailed(true)
      }}
      className={className}
    />
  )
}
