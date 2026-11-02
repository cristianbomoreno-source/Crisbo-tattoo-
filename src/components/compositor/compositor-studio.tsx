'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowClockwise, DownloadSimple, Eye, EyeSlash, ImageSquare, Plus, ShareNetwork, Sparkle, Stack, Trash, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { COMPOSITOR_SOURCES, type CompositorModelId, type CompositorSourceId } from '@/lib/compositor/prompts'
import type { Composition, CompositionSummary } from '@/lib/compositor/store'
import { buildPsd, type PsdLayer } from '@/lib/compositor/psd'
import { cn } from '@/lib/utils'

const MODELS: { id: CompositorModelId; label: string; hint: string }[] = [
  { id: 'nano-banana', label: 'Nano Banana', hint: 'Rápido' },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro', hint: 'Máximo detalle' },
]
/** Capas que se piden a la vez: más rápido sin saturar la IA. */
const PARALLEL = 3

type Draft = { id: string; nombre: string }
type LayerState = 'creando' | 'error'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

/** Tamaño original de la imagen, antes de achicarla: si es tamaño carta, el PSD sale de ese tamaño. */
async function naturalSize(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return { ancho: String(img.naturalWidth), alto: String(img.naturalHeight) }
  } finally {
    URL.revokeObjectURL(url)
  }
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

async function post(fields: Record<string, string | Blob>) {
  const body = new FormData()
  for (const [k, v] of Object.entries(fields)) body.set(k, v)
  const res = await fetch('/api/compositor', { method: 'POST', body })
  const json = (await res.json().catch(() => ({}))) as { error?: string; composition?: Composition; url?: string }
  if (!res.ok) throw new Error(json.error ?? 'Algo falló. Intenta de nuevo.')
  return json
}

/** Capas de la composición de abajo hacia arriba: fondo y elementos del de atrás al de adelante. */
function layersOf(c: Composition) {
  const list = c.elementos.map((e) => ({ id: e.id, nombre: e.nombre }))
  return c.fondo !== 'none' ? [{ id: 'fondo', nombre: 'Fondo' }, ...list] : list
}

export function CompositorStudio({ initialHistory }: { initialHistory: CompositionSummary[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [source, setSource] = useState<CompositorSourceId>('tatuaje')
  const [model, setModel] = useState<CompositorModelId>('nano-banana')
  const [comp, setComp] = useState<Composition | null>(null)
  const [draft, setDraft] = useState<Draft[]>([])
  const [fondoOn, setFondoOn] = useState(true)
  const [nuevo, setNuevo] = useState('')
  const [analizando, setAnalizando] = useState(false)
  const [creandoPlano, setCreandoPlano] = useState(false)
  const [layerState, setLayerState] = useState<Record<string, LayerState>>({})
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [verCompleto, setVerCompleto] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [history, setHistory] = useState(initialHistory)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const creandoCapas = Object.values(layerState).some((s) => s === 'creando')
  const busy = analizando || creandoPlano || creandoCapas

  useEffect(() => {
    if (!busy) return
    const t0 = Date.now()
    const t = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000)
    return () => clearInterval(t)
  }, [busy])

  // Al volver a la app: si saliste mientras se creaban las capas, el servidor las terminó y guardó.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      fetch('/api/compositor')
        .then((r) => r.json())
        .then((j: { items?: CompositionSummary[] }) => j.items && setHistory(j.items))
        .catch(() => {})
      if (!comp) return
      fetch(`/api/compositor?id=${comp.id}`)
        .then((r) => r.json())
        .then((j: { composition?: Composition }) => {
          if (!j.composition) return
          setComp(j.composition)
          setLayerState((s) => Object.fromEntries(Object.entries(s).filter(([k]) => !j.composition!.capas[k])))
        })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [comp])

  function pick(f: File | undefined) {
    if (!f) return
    if (f.type && !f.type.startsWith('image/')) return toast.error('Escoge una imagen')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function refreshHistory() {
    fetch('/api/compositor')
      .then((r) => r.json())
      .then((j: { items?: CompositionSummary[] }) => j.items && setHistory(j.items))
      .catch(() => {})
  }

  function open(c: Composition) {
    setComp(c)
    setDraft(c.elementos.map((e) => ({ id: e.id, nombre: e.nombre })))
    setFondoOn(c.fondo !== 'none')
    setModel(c.model === 'nano-banana-pro' ? 'nano-banana-pro' : 'nano-banana')
    setLayerState({})
    setHidden(new Set())
    setVerCompleto(false)
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  async function analizar() {
    if (!file) return
    setAnalizando(true)
    setElapsed(0)
    try {
      const { composition } = await post({ paso: 'analizar', image: await shrink(file), source, model, ...(await naturalSize(file)) })
      if (!composition) throw new Error('No se pudo analizar la referencia')
      open(composition)
      refreshHistory()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setAnalizando(false)
    }
  }

  async function crearCapa(c: Composition, id: string) {
    setLayerState((s) => ({ ...s, [id]: 'creando' }))
    try {
      const { url } = await post({ paso: 'capa', id: c.id, capa: id })
      if (!url) throw new Error('La capa no llegó')
      setComp((prev) => (prev && prev.id === c.id ? { ...prev, capas: { ...prev.capas, [id]: url } } : prev))
      setLayerState(({ [id]: _, ...rest }) => rest)
    } catch (e) {
      setLayerState((s) => ({ ...s, [id]: 'error' }))
      toast.error(`${layersOf(c).find((l) => l.id === id)?.nombre ?? 'Capa'}: ${(e as Error).message}`)
    }
  }

  async function crearCapas(c: Composition, ids: string[]) {
    const queue = [...ids]
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
        for (let id = queue.shift(); id; id = queue.shift()) await crearCapa(c, id)
      }),
    )
    // Corte final con todas las máscaras: cada píxel en una sola capa y el fondo con lo que sobró.
    try {
      const { composition } = await post({ paso: 'recortar', id: c.id })
      if (composition) setComp((prev) => (prev && prev.id === c.id ? composition : prev))
    } catch {}
    refreshHistory()
  }

  /** Guarda la lista revisada, crea el diseño plano y después todas las capas. */
  async function crear() {
    if (!comp) return
    const elementos = draft.filter((d) => d.nombre.trim())
    if (!elementos.length) return toast.error('Deja al menos un elemento')
    setCreandoPlano(true)
    setElapsed(0)
    let c: Composition
    try {
      const res = await post({ paso: 'plano', id: comp.id, elementos: JSON.stringify(elementos), fondo: fondoOn ? '1' : '0', model })
      if (!res.composition) throw new Error('No se pudo crear el diseño plano')
      c = res.composition
      setComp(c)
    } catch (e) {
      toast.error((e as Error).message)
      return
    } finally {
      setCreandoPlano(false)
    }
    setLayerState({})
    await crearCapas(
      c,
      layersOf(c).map((l) => l.id),
    )
  }

  async function exportar(share: boolean) {
    if (!comp?.planoUrl) return
    setExportando(true)
    try {
      const plano = await loadImage(comp.planoUrl)
      const layers: PsdLayer[] = []
      if (comp.fuenteUrl) layers.push({ name: 'Referencia', url: comp.fuenteUrl, hidden: true })
      for (const l of layersOf(comp)) {
        const url = comp.capas[l.id]
        if (url) layers.push({ name: l.nombre, url })
      }
      layers.push({ name: 'Diseño completo', url: comp.planoUrl, hidden: true })
      // Un diseño tamaño carta sale con los píxeles exactos de la imagen subida: encaja encima del original en Procreate.
      const blob = await buildPsd(layers, comp.lienzo?.width ?? plano.naturalWidth, comp.lienzo?.height ?? plano.naturalHeight)
      const name = `compositor-${comp.id}.psd`
      const psd = new File([blob], name, { type: 'image/vnd.adobe.photoshop' })
      // Solo el archivo, sin título: con título iOS a veces lo comparte como texto y esconde las apps que abren PSD.
      if (share && navigator.canShare?.({ files: [psd] })) {
        try {
          await navigator.share({ files: [psd] })
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setExportando(false)
    }
  }

  async function abrirHistorial(id: string) {
    try {
      const res = await fetch(`/api/compositor?id=${id}`)
      const j = (await res.json()) as { composition?: Composition; error?: string }
      if (!j.composition) throw new Error(j.error ?? 'No se pudo abrir')
      open(j.composition)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function borrar(id: string) {
    setHistory((h) => h.filter((x) => x.id !== id))
    if (comp?.id === id) setComp(null)
    await fetch(`/api/compositor?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  function toggle(id: string) {
    setHidden((h) => {
      const next = new Set(h)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const layers = comp ? layersOf(comp) : []
  const faltan = comp?.planoUrl ? layers.filter((l) => !comp.capas[l.id] && layerState[l.id] !== 'creando').map((l) => l.id) : []
  const listas = layers.filter((l) => comp?.capas[l.id]).length
  const revisando = !!comp && !comp.planoUrl

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-5">
        <section className="rounded-3xl bg-card p-4">
          <Step n={1} title="Referencia" />
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
              <span className="block font-semibold">{file ? 'Cambiar imagen' : 'Escoger foto del tatuaje'}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">Un tatuaje ya hecho o un diseño del que quieras sacar partes.</span>
            </span>
          </button>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {COMPOSITOR_SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                aria-pressed={source === s.id}
                className={cn(
                  'rounded-2xl border p-3 text-left transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.98]',
                  source === s.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50',
                )}
              >
                <span className="block text-[14px] leading-tight font-semibold">{s.label}</span>
                <span className="mt-1 block text-[12px] leading-snug text-muted-foreground">{s.hint}</span>
              </button>
            ))}
          </div>

          <p className="mt-4 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Inteligencia artificial</p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
            {MODELS.map((m) => (
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

          <Button size="lg" className="mt-4 h-13 w-full text-base" disabled={!file || busy} onClick={analizar}>
            <Sparkle weight="fill" className="size-5" />
            {analizando ? `Buscando elementos… ${elapsed}s` : 'Buscar elementos'}
          </Button>
        </section>

        {comp && (
          <section className="rounded-3xl bg-card p-4">
            <Step n={2} title="Capas" />
            {revisando ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">Esto encontró la IA. Cambia nombres, quita o agrega elementos antes de separar.</p>
                <ul className="mt-3 space-y-2">
                  {draft.map((d, i) => (
                    <li key={d.id} className="flex items-center gap-2">
                      <input
                        value={d.nombre}
                        onChange={(e) => setDraft((list) => list.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))}
                        className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-[15px]"
                        maxLength={40}
                      />
                      <button
                        type="button"
                        aria-label={`Quitar ${d.nombre}`}
                        onClick={() => setDraft((list) => list.filter((_, j) => j !== i))}
                        className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
                      >
                        <X className="size-5" />
                      </button>
                    </li>
                  ))}
                </ul>
                {draft.length < 6 && (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!nuevo.trim()) return
                      setDraft((list) => [...list, { id: `nuevo-${Date.now()}`, nombre: nuevo.trim() }])
                      setNuevo('')
                    }}
                  >
                    <input
                      value={nuevo}
                      onChange={(e) => setNuevo(e.target.value)}
                      placeholder="Agregar elemento (ej. Calavera)"
                      className="h-11 min-w-0 flex-1 rounded-xl border border-dashed border-border bg-background px-3 text-[15px]"
                      maxLength={40}
                    />
                    <button type="submit" aria-label="Agregar" className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted">
                      <Plus className="size-5" />
                    </button>
                  </form>
                )}
                <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">Capa de fondo</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">Humo, sombras, patrones o lo que haya detrás de los elementos</span>
                  </span>
                  <input type="checkbox" className="size-5 shrink-0 accent-[var(--primary)]" checked={fondoOn} onChange={(e) => setFondoOn(e.target.checked)} />
                </label>
                <Button size="lg" className="mt-4 h-13 w-full text-base" disabled={busy} onClick={crear}>
                  <Stack weight="fill" className="size-5" />
                  {creandoPlano ? `Creando diseño plano… ${elapsed}s` : `Separar en ${draft.length + (fondoOn ? 1 : 0)} capas`}
                </Button>
                {creandoPlano && <p className="mt-2 text-center text-sm text-muted-foreground">Primero el diseño plano completo y después cada capa. Tarda unos 2 minutos.</p>}
              </>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
                  {[...layers].reverse().map((l) => {
                    const url = comp.capas[l.id]
                    const st = layerState[l.id]
                    return (
                      <li key={l.id} className="flex items-center gap-3 p-2">
                        <span className="checker grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg">
                          {url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="" className="size-full object-contain" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold">{l.nombre}</span>
                          <span className="block text-[12px] text-muted-foreground">
                            {url ? 'Lista' : st === 'creando' ? `Separando… ${elapsed}s` : st === 'error' ? 'Falló' : 'Pendiente'}
                          </span>
                        </span>
                        {url && (
                          <button
                            type="button"
                            aria-label={hidden.has(l.id) ? `Mostrar ${l.nombre}` : `Ocultar ${l.nombre}`}
                            onClick={() => toggle(l.id)}
                            className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                          >
                            {hidden.has(l.id) ? <EyeSlash className="size-5" /> : <Eye className="size-5" />}
                          </button>
                        )}
                        {st !== 'creando' && (
                          <button
                            type="button"
                            aria-label={`Rehacer ${l.nombre}`}
                            onClick={() => crearCapas(comp, [l.id])}
                            className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                          >
                            <ArrowClockwise className="size-5" />
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {faltan.length > 0 && !creandoCapas && (
                  <Button size="lg" variant="secondary" className="mt-3 w-full" onClick={() => crearCapas(comp, faltan)}>
                    <Stack className="size-5" /> Crear {faltan.length === 1 ? 'la capa que falta' : `las ${faltan.length} capas que faltan`}
                  </Button>
                )}
                {creandoCapas && <p className="mt-2 text-center text-sm text-muted-foreground">Cada capa tarda entre 20 segundos y 1 minuto. Si sales de la app, se siguen haciendo.</p>}
              </>
            )}
          </section>
        )}
      </div>

      <div ref={resultRef} className="scroll-mt-4 space-y-5">
        <section className="rounded-3xl bg-card p-4">
          <h2 className="text-[17px] font-semibold">Resultado</h2>
          {!comp ? (
            <div className="mt-3 grid aspect-square place-items-center rounded-2xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              Sube la foto de un tatuaje: la IA lo pasa a diseño plano y separa cada elemento en su propia capa para Procreate.
            </div>
          ) : (
            <>
              <div className="checker relative mt-3 aspect-square overflow-hidden rounded-2xl">
                {!comp.planoUrl && comp.fuenteUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={comp.fuenteUrl} alt="Referencia" className="absolute inset-0 size-full object-contain" />
                )}
                {comp.planoUrl && (verCompleto || listas === 0) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={comp.planoUrl} alt="Diseño plano" className="absolute inset-0 size-full object-contain" />
                )}
                {comp.planoUrl &&
                  !verCompleto &&
                  layers.map((l) =>
                    comp.capas[l.id] && !hidden.has(l.id) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={l.id} src={comp.capas[l.id]} alt={l.nombre} className="absolute inset-0 size-full object-contain" />
                    ) : null,
                  )}
              </div>
              {comp.planoUrl && listas > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
                  {[
                    { v: false, label: 'Capas' },
                    { v: true, label: 'Diseño completo' },
                  ].map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      aria-pressed={verCompleto === o.v}
                      onClick={() => setVerCompleto(o.v)}
                      className={cn(
                        'rounded-xl py-2 text-sm font-semibold transition-[background-color,color] duration-150 ease-out',
                        verCompleto === o.v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {listas > 0 && (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button size="lg" onClick={() => exportar(true)} disabled={exportando || creandoCapas}>
                      <ShareNetwork className="size-5" /> Enviar a Procreate
                    </Button>
                    <Button size="lg" variant="secondary" onClick={() => exportar(false)} disabled={exportando || creandoCapas}>
                      <DownloadSimple className="size-5" /> Descargar PSD
                    </Button>
                  </div>
                  <p className="mt-2 text-center text-[13px] text-muted-foreground">
                    {exportando
                      ? 'Armando el archivo…'
                      : 'Archivo .psd con una capa por elemento; la referencia y el diseño completo van ocultos abajo y arriba. Si Procreate no aparece al compartir, busca en "Más" o toca "Guardar en Archivos" y en Procreate usa Importar.'}
                  </p>
                </>
              )}
            </>
          )}
        </section>

        {history.length > 0 && (
          <section className="rounded-3xl bg-card p-4">
            <h2 className="text-[17px] font-semibold">Tus composiciones</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {history.map((item) => (
                <div key={item.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => abrirHistorial(item.id)}
                    className={cn(
                      'block aspect-square w-full overflow-hidden rounded-xl bg-white transition-transform duration-150 ease-out active:scale-[0.97]',
                      comp?.id === item.id && 'ring-2 ring-primary',
                    )}
                  >
                    {item.thumbUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbUrl} alt="" loading="lazy" className="size-full object-contain" />
                    )}
                  </button>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </p>
                  <button
                    type="button"
                    aria-label="Borrar composición"
                    onClick={() => borrar(item.id)}
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
