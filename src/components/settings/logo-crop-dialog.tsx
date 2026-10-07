'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ZoomIn } from 'lucide-react'

/** Tamaño del viewport cuadrado donde se encuadra (en px CSS). */
const VIEWPORT = 280
/** Resolución de salida del recorte (cuadrado). */
const OUTPUT = 600
const MAX_ZOOM = 3

type Point = { x: number; y: number }

/**
 * Encuadre circular de foto de perfil, estilo Instagram: se arrastra la
 * imagen para posicionarla y se hace zoom (pellizco con dos dedos, rueda
 * del mouse o el slider) dentro de un círculo guía. Al confirmar, recorta
 * exactamente lo que se ve dentro del círculo a un PNG cuadrado de
 * OUTPUT×OUTPUT y lo entrega como File — el resto del flujo (uploadStudioLogo)
 * no cambia, solo ahora recibe la imagen ya encuadrada en vez del archivo
 * crudo tal cual salió de la cámara/galería.
 */
export function LogoCropDialog({
  file,
  onCancel,
  onConfirm,
}: {
  file: File | null
  onCancel: () => void
  onConfirm: (cropped: File) => void
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 })
  const [exporting, setExporting] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; origin: Point } | null>(null)
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)

  useEffect(() => {
    if (!file) {
      setImgUrl(null)
      setNatural(null)
      return
    }
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    setZoom(1)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Escala base: la que hace que la imagen cubra el círculo completo a
  // zoom = 1 (equivalente a `object-fit: cover`).
  const baseScale = useMemo(() => {
    if (!natural) return 1
    return Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h)
  }, [natural])

  const displayScale = baseScale * zoom
  const displayW = natural ? natural.w * displayScale : 0
  const displayH = natural ? natural.h * displayScale : 0

  const clamp = useCallback(
    (p: Point, w: number, h: number): Point => ({
      x: Math.min(0, Math.max(VIEWPORT - w, p.x)),
      y: Math.min(0, Math.max(VIEWPORT - h, p.y)),
    }),
    []
  )

  function onImgLoad() {
    const el = imgRef.current
    if (!el) return
    const w = el.naturalWidth
    const h = el.naturalHeight
    setNatural({ w, h })
    const scale = Math.max(VIEWPORT / w, VIEWPORT / h)
    setPos({ x: (VIEWPORT - w * scale) / 2, y: (VIEWPORT - h * scale) / 2 })
  }

  // Recentra/clampa cada vez que cambia el zoom (evita que quede hueco
  // vacío dentro del círculo al alejar).
  useEffect(() => {
    if (!natural) return
    setPos((p) => clamp(p, displayW, displayH))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, natural])

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: pos }
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPos(clamp({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy }, displayW, displayH))
  }
  function handlePointerUp() {
    dragRef.current = null
  }

  function touchDist(t: React.TouchList): number {
    const a = t[0]!
    const b = t[1]!
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = { startDist: touchDist(e.touches), startZoom: zoom }
    } else if (e.touches.length === 1) {
      dragRef.current = { startX: e.touches[0]!.clientX, startY: e.touches[0]!.clientY, origin: pos }
    }
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      const dist = touchDist(e.touches)
      const ratio = dist / pinchRef.current.startDist
      setZoom(Math.min(MAX_ZOOM, Math.max(1, pinchRef.current.startZoom * ratio)))
    } else if (e.touches.length === 1 && dragRef.current) {
      const dx = e.touches[0]!.clientX - dragRef.current.startX
      const dy = e.touches[0]!.clientY - dragRef.current.startY
      setPos(clamp({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy }, displayW, displayH))
    }
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchRef.current = null
    if (e.touches.length < 1) dragRef.current = null
  }
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z - e.deltaY * 0.0015)))
  }

  async function handleConfirm() {
    if (!imgRef.current || !natural || !file) return
    setExporting(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT
      canvas.height = OUTPUT
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const outScale = OUTPUT / VIEWPORT
      ctx.drawImage(
        imgRef.current,
        0,
        0,
        natural.w,
        natural.h,
        pos.x * outScale,
        pos.y * outScale,
        displayW * outScale,
        displayH * outScale
      )
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      )
      if (!blob) return
      const cropped = new File([blob], file.name.replace(/\.\w+$/, '') + '-encuadrado.jpg', {
        type: 'image/jpeg',
      })
      onConfirm(cropped)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={file !== null} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Encuadrar foto</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative touch-none overflow-hidden rounded-2xl bg-black"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {imgUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={imgUrl}
                alt=""
                onLoad={onImgLoad}
                draggable={false}
                className="absolute select-none"
                style={{
                  width: displayW || undefined,
                  height: displayH || undefined,
                  left: pos.x,
                  top: pos.y,
                }}
              />
            )}
            {/* Máscara: círculo guía, oscurece lo que queda afuera */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: `0 0 0 999px rgba(0,0,0,0.55)`,
                borderRadius: '9999px',
                margin: 0,
              }}
            />
          </div>

          <div className="flex w-full items-center gap-3 px-1">
            <ZoomIn className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full flex-1 cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
            />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Arrastra para mover y pellizca (o usa el control) para hacer zoom.
          </p>

          <div className="flex w-full gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={exporting}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={handleConfirm} disabled={exporting || !natural}>
              {exporting ? 'Guardando…' : 'Usar foto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
