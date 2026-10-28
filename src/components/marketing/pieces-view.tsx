'use client'

import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { CaretLeft, CaretRight, DownloadSimple, PencilSimple } from '@phosphor-icons/react'
import { getFontEmbedCSS, toBlob } from 'html-to-image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { STATUS_LABEL, isStorySlide, type Campaign, type MarketingAction, type Slide } from '@/lib/marketing/types'
import { makeZip, slug, type ZipEntry } from '@/lib/marketing/zip'
import { autoPhoto } from './action-editor'
import { SlideCanvas, SlidePreview } from './slide-canvas'

type Piece = { slide: Slide; photo?: string; isLast: boolean }
type Viewing = { action: MarketingAction; index: number }

const dayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const dayLabel = (d: string) => {
  const t = dayFmt.format(new Date(`${d}T12:00:00Z`))
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const fileName = (a: MarketingAction, i: number) => `${a.date}-${slug(a.title)}-${String(i + 1).padStart(2, '0')}.png`

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/**
 * Todas las piezas gráficas del plan (carruseles e historias) con su vista
 * previa. Cada lámina se abre en grande; se descargan sueltas, por pieza o
 * todas juntas en un ZIP, ya en el tamaño de Instagram.
 */
export function PiecesView({
  actions,
  campaigns,
  gallery,
  onEdit,
}: {
  actions: MarketingAction[]
  campaigns: Campaign[]
  gallery: string[]
  onEdit: (id: string) => void
}) {
  const [kind, setKind] = useState<'all' | 'carrusel' | 'historias'>('all')
  const [viewing, setViewing] = useState<Viewing | null>(null)
  const [exporting, setExporting] = useState<Piece | null>(null)
  const [busy, setBusy] = useState<{ id: string; done: number; total: number } | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  // Las fuentes se incrustan una sola vez: es lo que más tarda en cada imagen.
  const fontCss = useRef<string | null>(null)

  const campById = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns])
  const withSlides = useMemo(
    () =>
      actions
        .filter((a) => (a.slides?.length ?? 0) > 0 && (kind === 'all' || a.fmt === kind))
        .sort((x, y) => (x.date + (x.time ?? '99')).localeCompare(y.date + (y.time ?? '99'))),
    [actions, kind],
  )
  const totalImages = withSlides.reduce((n, a) => n + (a.slides?.length ?? 0), 0)

  const pieceOf = (a: MarketingAction, i: number): Piece => {
    const s = a.slides![i]!
    return { slide: s, photo: s.photo || autoPhoto(gallery, `${a.id}-${i}`), isLast: i === a.slides!.length - 1 }
  }

  async function renderBlob(p: Piece): Promise<Blob> {
    setExporting(p)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise((r) => setTimeout(r, 250))
    const node = exportRef.current
    if (!node) throw new Error('No se pudo preparar la imagen')
    fontCss.current ??= await getFontEmbedCSS(node)
    const blob = await toBlob(node, {
      width: 1080,
      height: isStorySlide(p.slide) ? 1920 : 1350,
      pixelRatio: 1,
      fontEmbedCSS: fontCss.current,
    })
    if (!blob) throw new Error('La imagen salió vacía')
    return blob
  }

  async function downloadOne(a: MarketingAction, i: number) {
    if (busy) return
    setBusy({ id: a.id, done: 0, total: 1 })
    try {
      saveBlob(await renderBlob(pieceOf(a, i)), fileName(a, i))
    } catch (e) {
      toast.error(`No se pudo descargar: ${(e as Error).message}`)
    } finally {
      setExporting(null)
      setBusy(null)
    }
  }

  async function downloadZip(list: MarketingAction[], id: string, zipName: string, folders: boolean) {
    if (busy) return
    const jobs = list.flatMap((a) => a.slides!.map((_, i) => ({ a, i })))
    setBusy({ id, done: 0, total: jobs.length })
    try {
      const entries: ZipEntry[] = []
      for (const [n, { a, i }] of jobs.entries()) {
        const blob = await renderBlob(pieceOf(a, i))
        const name = folders ? `${a.date}-${slug(a.title)}/${String(i + 1).padStart(2, '0')}.png` : fileName(a, i)
        entries.push({ name, data: new Uint8Array(await blob.arrayBuffer()) })
        setBusy({ id, done: n + 1, total: jobs.length })
      }
      saveBlob(new Blob([makeZip(entries) as BlobPart], { type: 'application/zip' }), zipName)
      toast.success(`${entries.length} imágenes en ${zipName}`)
    } catch (e) {
      toast.error(`No se pudo descargar: ${(e as Error).message}`)
    } finally {
      setExporting(null)
      setBusy(null)
    }
  }

  const busyLabel = (id: string, idle: string) => (busy?.id === id ? (busy.total > 1 ? `Preparando ${busy.done}/${busy.total}…` : 'Preparando…') : idle)

  return (
    <div className="space-y-5">
      {/* Resumen y descarga general */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(
            [
              ['all', 'Todo'],
              ['carrusel', 'Carruseles'],
              ['historias', 'Historias'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                'h-9 rounded-full px-4 text-[14px] font-semibold',
                kind === k ? 'bg-foreground text-background' : 'bg-foreground/[0.07] text-muted-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!!busy || totalImages === 0}
          onClick={() => downloadZip(withSlides, 'all', `crisbo-piezas-${kind === 'all' ? 'todas' : kind}.zip`, true)}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-50"
        >
          <DownloadSimple className="size-5" weight="bold" />
          {busyLabel('all', `Descargar todo · ${totalImages} imágenes`)}
        </button>
      </div>

      {withSlides.length === 0 && <p className="py-10 text-center text-muted-foreground">No hay piezas con láminas.</p>}

      {withSlides.map((a) => {
        const camp = campById.get(a.camp)
        const story = a.fmt === 'historias'
        return (
          <section key={a.id} className="rounded-[1.5rem] bg-card p-4 [content-visibility:auto] [contain-intrinsic-size:auto_360px] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: camp?.color }} />
                  <span>{dayLabel(a.date)}</span>
                  {a.time ? ` · ${a.time}` : ''} · {story ? 'Historias' : 'Carrusel'} · {a.slides!.length} {a.slides!.length === 1 ? 'imagen' : 'imágenes'}
                </p>
                <h3 className="mt-0.5 text-[1.1875rem] leading-snug font-bold">{a.title}</h3>
                <p className="text-[13px] text-muted-foreground">
                  {camp?.name}
                  {a.kw ? ` · palabra clave ${a.kw}` : ''} · {STATUS_LABEL[a.status]}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(a.id)}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-foreground/[0.08] px-4 text-[14px] font-semibold active:scale-[0.97]"
                >
                  <PencilSimple className="size-4" weight="bold" />
                  Editar
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => downloadZip([a], a.id, `${a.date}-${slug(a.title)}.zip`, false)}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-primary/15 px-4 text-[14px] font-semibold text-primary active:scale-[0.97] disabled:opacity-50"
                >
                  <DownloadSimple className="size-4" weight="bold" />
                  {busyLabel(a.id, 'ZIP')}
                </button>
              </div>
            </div>

            <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5">
              {a.slides!.map((s, i) => {
                const p = pieceOf(a, i)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setViewing({ action: a, index: i })}
                    className="relative shrink-0 snap-start transition-transform active:scale-[0.98]"
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <SlidePreview slide={p.slide} photo={p.photo} isLast={p.isLast} width={isStorySlide(s) ? 158 : 224} />
                    <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[12px] font-semibold text-white tabular-nums">{i + 1}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <Lightbox
        viewing={viewing}
        onChange={setViewing}
        pieceOf={pieceOf}
        busy={!!busy}
        onDownload={(a, i) => downloadOne(a, i)}
      />

      {/* Lámina a tamaño real para exportar (fuera de pantalla). */}
      {exporting && (
        <div aria-hidden="true" style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none' }}>
          <SlideCanvas ref={exportRef} slide={exporting.slide} photo={exporting.photo} isLast={exporting.isLast} />
        </div>
      )}
    </div>
  )
}

const subscribeResize = (cb: () => void) => {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
/** Tamaño de la ventana, para que la lámina en grande quepa completa. */
function useViewport(): [number, number] {
  const key = useSyncExternalStore(
    subscribeResize,
    () => `${window.innerWidth}x${window.innerHeight}`,
    () => '1024x768',
  )
  const [w, h] = key.split('x').map(Number)
  return [w!, h!]
}

function Lightbox({
  viewing,
  onChange,
  pieceOf,
  busy,
  onDownload,
}: {
  viewing: Viewing | null
  onChange: (v: Viewing | null) => void
  pieceOf: (a: MarketingAction, i: number) => Piece
  busy: boolean
  onDownload: (a: MarketingAction, i: number) => void
}) {
  const a = viewing?.action
  const i = viewing?.index ?? 0
  const total = a?.slides?.length ?? 0
  const p = a ? pieceOf(a, i) : null
  const story = p ? isStorySlide(p.slide) : false
  const [vw, vh] = useViewport()
  const go = (d: -1 | 1) => a && onChange({ action: a, index: Math.min(total - 1, Math.max(0, i + d)) })

  return (
    <Dialog open={!!viewing} onOpenChange={(o) => !o && onChange(null)}>
      <DialogContent
        className="max-h-[96dvh] gap-3 overflow-y-auto sm:max-w-fit"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1)
          if (e.key === 'ArrowRight') go(1)
        }}
      >
        <DialogTitle className="pr-10 text-[1.0625rem]">
          {a?.title} <span className="font-normal text-muted-foreground tabular-nums">· {i + 1} de {total}</span>
        </DialogTitle>
        {p && (
          <div className="mx-auto">
            <SlidePreview
              slide={p.slide}
              photo={p.photo}
              isLast={p.isLast}
              width={Math.round(Math.min(story ? 380 : 460, vw - 72, (vh - 176) * (story ? 1080 / 1920 : 1080 / 1350)))}
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={i === 0}
            aria-label="Anterior"
            className="grid size-11 place-items-center rounded-full bg-foreground/[0.08] disabled:opacity-30"
          >
            <CaretLeft className="size-5" weight="bold" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => a && onDownload(a, i)}
            className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground active:scale-[0.97] disabled:opacity-50"
          >
            <DownloadSimple className="size-5" weight="bold" />
            {busy ? 'Preparando…' : 'Descargar imagen'}
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={i >= total - 1}
            aria-label="Siguiente"
            className="grid size-11 place-items-center rounded-full bg-foreground/[0.08] disabled:opacity-30"
          >
            <CaretRight className="size-5" weight="bold" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
