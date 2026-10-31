'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Copy, DownloadSimple, ImageSquare, Printer, Sparkle, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { STENCIL_MODELS, STENCIL_STYLES, type StencilModelId, type StencilStyleId } from '@/lib/stencil/styles'
import { applyInk } from '@/lib/stencil/ink'
import type { StencilItem } from '@/lib/stencil/store'
import { cn } from '@/lib/utils'

const COLORS = [
  { value: '#000000', label: 'Negro' },
  { value: '#5b3fd6', label: 'Morado' },
  { value: '#2563eb', label: 'Azul' },
  { value: '#d92b2b', label: 'Rojo' },
  { value: '#16a34a', label: 'Verde' },
]
/** Lado largo del stencil final: suficiente para imprimir a 300 ppp ~25 cm. */
const OUTPUT_LONG_SIDE = 3000

type Result = { id: string; raw: string; src: string | null }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

/** Achica la foto antes de subirla (máx. 2048 px, JPEG) para no pasar el límite de 4 MB. */
async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const k = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * k)
    c.height = Math.round(img.naturalHeight * k)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo leer la foto'))), 'image/jpeg', 0.9))
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function renderInk(raw: string, opts: { color: string; transparent: boolean; threshold: number }): Promise<Blob> {
  const img = await loadImage(raw)
  const k = Math.min(3, OUTPUT_LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * k)
  c.height = Math.round(img.naturalHeight * k)
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, c.width, c.height)
  const data = ctx.getImageData(0, 0, c.width, c.height)
  applyInk(data.data, opts)
  ctx.putImageData(data, 0, 0)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo generar el PNG'))), 'image/png'))
}

export function StencilStudio({ initialHistory }: { initialHistory: StencilItem[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [style, setStyle] = useState<StencilStyleId>('detalle')
  const [model, setModel] = useState<StencilModelId>('nano-banana')
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [color, setColor] = useState('#000000')
  const [transparent, setTransparent] = useState(false)
  const [threshold, setThreshold] = useState(170)
  const [output, setOutput] = useState<{ url: string; blob: Blob } | null>(null)
  const [split, setSplit] = useState(100)
  const [opacity, setOpacity] = useState(100)
  const [printCm, setPrintCm] = useState(15)
  const [history, setHistory] = useState(initialHistory)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!busy) return
    const t0 = Date.now()
    const t = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000)
    return () => clearInterval(t)
  }, [busy])

  // Color, fondo y limpieza se aplican en el navegador: cambiarlos no gasta IA.
  useEffect(() => {
    if (!result) return
    let cancelled = false
    let url: string | null = null
    const timer = setTimeout(async () => {
      try {
        const blob = await renderInk(result.raw, { color, transparent, threshold })
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setOutput({ url, blob })
      } catch (e) {
        toast.error((e as Error).message)
      }
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (url) URL.revokeObjectURL(url)
    }
  }, [result, color, transparent, threshold])

  function pick(f: File | undefined) {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast.error('Escoge una imagen')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function create() {
    if (!file) return
    setBusy(true)
    setElapsed(0)
    try {
      const body = new FormData()
      body.set('image', await shrink(file), 'imagen.jpg')
      body.set('style', style)
      body.set('model', model)
      const res = await fetch('/api/stencil', { method: 'POST', body })
      const json = (await res.json().catch(() => ({}))) as { id?: string; image?: string; error?: string }
      if (!res.ok || !json.image || !json.id) throw new Error(json.error ?? 'No se pudo crear el stencil')
      setResult({ id: json.id, raw: json.image, src: preview })
      setSplit(100)
      setOpacity(100)
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      fetch('/api/stencil')
        .then((r) => r.json())
        .then((j: { items?: StencilItem[] }) => j.items && setHistory(j.items))
        .catch(() => {})
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function download() {
    if (!output || !result) return
    const a = document.createElement('a')
    a.href = output.url
    a.download = `stencil-${STENCIL_STYLES.find((s) => s.id === style)?.id ?? 'crisbo'}-${result.id.split('__')[0]}.png`
    a.click()
  }

  async function copy() {
    if (!output) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': output.blob })])
      toast.success('Copiado. Pégalo en Procreate')
    } catch {
      toast.error('Este navegador no deja copiar imágenes. Usa Descargar.')
    }
  }

  function print() {
    if (!output) return
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(frame)
    const doc = frame.contentDocument!
    doc.open()
    doc.write(
      `<!doctype html><html><head><title>Stencil</title><style>@page{margin:10mm}html,body{margin:0}img{width:${printCm}cm;height:auto;display:block}</style></head><body><img src="${output.url}"></body></html>`,
    )
    doc.close()
    const img = doc.querySelector('img')!
    const go = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      setTimeout(() => frame.remove(), 1000)
    }
    if (img.complete) go()
    else img.onload = go
  }

  async function remove(id: string) {
    setHistory((h) => h.filter((x) => x.id !== id))
    await fetch(`/api/stencil?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
  }

  function openFromHistory(item: StencilItem) {
    setStyle(item.style)
    setModel(item.model)
    setResult({ id: item.id, raw: item.url, src: item.srcUrl })
    setSplit(100)
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const slow = model === 'seedream'

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-5">
        <section className="rounded-3xl bg-card p-4">
          <Step n={1} title="Imagen" />
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              pick(e.dataTransfer.files?.[0])
            }}
            className="mt-3 flex w-full items-center gap-4 rounded-2xl border border-dashed border-border p-3 text-left transition-colors duration-150 ease-out hover:bg-muted/50 active:scale-[0.99]"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-muted">
                <ImageSquare className="size-8 text-muted-foreground" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-semibold">{file ? 'Cambiar imagen' : 'Escoger foto o diseño'}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">Recorta cerca: que el diseño llene la foto y se vea nítido.</span>
            </span>
          </button>
        </section>

        <section className="rounded-3xl bg-card p-4">
          <Step n={2} title="Estilo" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {STENCIL_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                aria-pressed={style === s.id}
                className={cn(
                  'rounded-2xl border p-3 text-left transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.98]',
                  style === s.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50',
                  s.id === 'detalle' && 'col-span-2',
                )}
              >
                <span className="block text-[15px] font-semibold">{s.label}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{s.hint}</span>
              </button>
            ))}
          </div>

          <p className="mt-4 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Inteligencia artificial</p>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
            {STENCIL_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                aria-pressed={model === m.id}
                className={cn(
                  'rounded-xl px-2 py-2 text-center transition-[background-color,color] duration-150 ease-out',
                  model === m.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="block text-[11px] leading-tight">{m.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <Button size="lg" className="h-13 w-full text-base pointer-coarse:h-13" disabled={!file || busy} onClick={create}>
          <Sparkle weight="fill" className="size-5" />
          {busy ? `Creando stencil… ${elapsed}s` : 'Crear stencil'}
        </Button>
        {busy && (
          <p className="text-center text-sm text-muted-foreground">
            {slow ? 'Seedream tarda hasta 3 minutos.' : 'Tarda entre 20 segundos y 1 minuto.'} No cierres esta página.
          </p>
        )}
      </div>

      <div ref={resultRef} className="scroll-mt-4 space-y-5">
        <section className="rounded-3xl bg-card p-4">
          <h2 className="text-[17px] font-semibold">Resultado</h2>
          {!result ? (
            <div className="mt-3 grid aspect-[3/4] place-items-center rounded-2xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              Aquí aparece tu stencil. Desliza para compararlo con la foto original.
            </div>
          ) : (
            <>
              <div
                className="relative mt-3 overflow-hidden rounded-2xl bg-white select-none"
                style={transparent ? { backgroundImage: 'repeating-conic-gradient(#e5e5e5 0 25%, #fff 0 50%)', backgroundSize: '20px 20px' } : undefined}
              >
                {result.src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.src} alt="Original" className="absolute inset-0 size-full object-contain" />
                )}
                {output ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={output.url}
                    alt="Stencil"
                    className="relative block w-full"
                    style={{ opacity: opacity / 100, clipPath: `inset(0 ${100 - split}% 0 0)` }}
                  />
                ) : (
                  <div className="aspect-[3/4]" />
                )}
                {result.src && split < 100 && (
                  <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.3)]" style={{ left: `${split}%` }} />
                )}
              </div>

              <div className="mt-4 space-y-3">
                {result.src && <Range label="Comparar con la foto" value={split} onChange={setSplit} display={split === 100 ? 'Stencil' : `${split}%`} />}
                {result.src && <Range label="Opacidad del stencil" value={opacity} onChange={setOpacity} display={`${opacity}%`} />}
                <Range label="Limpieza" value={threshold} min={90} max={235} onChange={setThreshold} display={threshold < 150 ? 'Menos trazos' : threshold > 200 ? 'Más detalle' : 'Normal'} />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex gap-2" role="radiogroup" aria-label="Color de línea">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={color === c.value}
                      aria-label={c.label}
                      onClick={() => setColor(c.value)}
                      className={cn(
                        'size-9 rounded-full border-2 transition-transform duration-150 ease-out active:scale-90',
                        color === c.value ? 'border-foreground' : 'border-transparent',
                      )}
                    >
                      <span className="mx-auto block size-6 rounded-full" style={{ background: c.value }} />
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
                  Sin fondo
                </label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={download} disabled={!output} size="lg">
                  <DownloadSimple className="size-5" /> Descargar PNG
                </Button>
                <Button onClick={copy} disabled={!output} variant="secondary" size="lg">
                  <Copy className="size-5" /> Copiar para Procreate
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-2xl bg-muted/60 p-2 pl-4">
                <span className="text-sm font-medium">Imprimir de</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={2}
                  max={40}
                  value={printCm}
                  onChange={(e) => setPrintCm(Math.max(2, Math.min(40, Number(e.target.value) || 0)))}
                  className="h-10 w-16 rounded-xl bg-background text-center font-semibold tabular-nums"
                  aria-label="Ancho en centímetros"
                />
                <span className="text-sm font-medium">cm de ancho</span>
                <Button onClick={print} disabled={!output} variant="outline" className="ml-auto">
                  <Printer className="size-5" /> Imprimir
                </Button>
              </div>
            </>
          )}
        </section>

        {history.length > 0 && (
          <section className="rounded-3xl bg-card p-4">
            <h2 className="text-[17px] font-semibold">Tus stencils</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {history.map((item) => (
                <div key={item.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => openFromHistory(item)}
                    className={cn(
                      'block aspect-[3/4] w-full overflow-hidden rounded-xl bg-white transition-transform duration-150 ease-out active:scale-[0.97]',
                      result?.id === item.id && 'ring-2 ring-primary',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="" loading="lazy" className="size-full object-contain" />
                  </button>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {STENCIL_STYLES.find((s) => s.id === item.style)?.label} · {STENCIL_MODELS.find((m) => m.id === item.model)?.label}
                  </p>
                  <button
                    type="button"
                    aria-label="Borrar stencil"
                    onClick={() => remove(item.id)}
                    className="absolute top-1 right-1 grid size-8 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100"
                  >
                    <Trash className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[17px] font-semibold">
      <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground tabular-nums">{n}</span>
      {title}
    </h2>
  )
}

function Range({
  label,
  value,
  onChange,
  display,
  min = 0,
  max = 100,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  display: string
  min?: number
  max?: number
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-6 w-full accent-[var(--primary)]"
      />
    </label>
  )
}
