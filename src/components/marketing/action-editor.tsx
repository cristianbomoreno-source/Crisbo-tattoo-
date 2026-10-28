'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Copy, DownloadSimple, Plus, Trash } from '@phosphor-icons/react'
import { toPng } from 'html-to-image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FORMAT_LABEL,
  STATUS_LABEL,
  isStorySlide,
  type ActionFormat,
  type ActionStatus,
  type Campaign,
  type MarketingAction,
  type Slide,
  type SlideTemplate,
} from '@/lib/marketing/types'
import { slug } from '@/lib/marketing/zip'
import { SlideCanvas, SlidePreview } from './slide-canvas'

/** Id nuevo para acciones (a…) y láminas (s…). */
const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`
const CAROUSEL_TPL: [SlideTemplate, string][] = [
  ['cover', 'Portada'],
  ['point', 'Punto con número'],
  ['text', 'Texto'],
  ['review', 'Reseña'],
  ['cta', 'Cierre con palabra clave'],
]
const STORY_TPL: [SlideTemplate, string][] = [
  ['story', 'Historia'],
  ['story-countdown', 'Cuenta regresiva'],
  ['story-poll', 'Encuesta'],
  ['story-cta', 'Palabra clave'],
]

/** Foto automática: una de la galería del estudio, fija por acción y lámina. */
export function autoPhoto(gallery: string[], seed: string) {
  if (gallery.length === 0) return undefined
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return gallery[h % gallery.length]
}

/**
 * Hoja para editar una acción del plan: datos (fecha, formato, campaña,
 * estado, gancho, palabra clave), guion, texto del post y, en carruseles e
 * historias, las láminas con vista previa real y descarga en PNG.
 */
export function ActionEditor({
  action: a,
  campaigns,
  gallery,
  onChange,
  onClose,
  onDelete,
  onDuplicate,
}: {
  action: MarketingAction
  campaigns: Campaign[]
  gallery: string[]
  onChange: (p: Partial<MarketingAction>) => void
  onClose: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const [sel, setSel] = useState(0)
  const [confirmDel, setConfirmDel] = useState(false)
  const [exporting, setExporting] = useState<Slide | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const slides = a.slides ?? []
  const current = slides[sel]
  const visual = a.fmt === 'carrusel' || a.fmt === 'historias'
  const photoFor = (s: Slide, i: number) => s.photo || autoPhoto(gallery, `${a.id}-${i}`)

  function setSlides(next: Slide[]) {
    onChange({ slides: next })
  }
  function patchSlide(p: Partial<Slide>) {
    if (!current) return
    setSlides(slides.map((s, i) => (i === sel ? { ...s, ...p } : s)))
  }
  function addSlide() {
    const story = a.fmt === 'historias'
    const s: Slide = { id: newId('s'), tpl: story ? 'story' : 'point', title: 'Título', body: '' }
    const next = [...slides, s]
    setSlides(next)
    setSel(next.length - 1)
  }
  function moveSlide(dir: -1 | 1) {
    const j = sel + dir
    if (j < 0 || j >= slides.length) return
    const next = [...slides]
    ;[next[sel], next[j]] = [next[j]!, next[sel]!]
    setSlides(next)
    setSel(j)
  }
  function deleteSlide() {
    const next = slides.filter((_, i) => i !== sel)
    setSlides(next)
    setSel(Math.max(0, sel - 1))
  }

  async function renderPng(s: Slide, i: number): Promise<string> {
    setExporting({ ...s, photo: photoFor(s, i) })
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise((r) => setTimeout(r, 250))
    const node = exportRef.current
    if (!node) throw new Error('No se pudo preparar la imagen')
    const story = isStorySlide(s)
    return toPng(node, { width: 1080, height: story ? 1920 : 1350, pixelRatio: 1, cacheBust: true })
  }
  function download(url: string, name: string) {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
  }
  async function exportOne() {
    if (!current) return
    try {
      const url = await renderPng(current, sel)
      download(url, `${a.date}-${slug(a.title)}-${String(sel + 1).padStart(2, '0')}.png`)
    } catch (e) {
      toast.error(`No se pudo descargar: ${(e as Error).message}`)
    } finally {
      setExporting(null)
    }
  }
  async function exportAll() {
    try {
      for (let i = 0; i < slides.length; i++) {
        const url = await renderPng(slides[i]!, i)
        download(url, `${a.date}-${slug(a.title)}-${String(i + 1).padStart(2, '0')}.png`)
      }
      toast.success(`${slides.length} imágenes descargadas`)
    } catch (e) {
      toast.error(`No se pudo descargar: ${(e as Error).message}`)
    } finally {
      setExporting(null)
    }
  }
  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${what} copiado`)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const camp = campaigns.find((c) => c.id === a.camp)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[min(100vw-1rem,72rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4 pr-14" style={{ boxShadow: `inset 4px 0 0 ${camp?.color}` }}>
          <div className="min-w-0 flex-1">
            <DialogTitle className="sr-only">{a.title}</DialogTitle>
            <input
              value={a.title}
              onChange={(e) => onChange({ title: e.target.value })}
              aria-label="Título"
              className="w-full bg-transparent font-title text-[1.5rem] font-bold tracking-tight outline-none"
            />
            <p className="text-[13px] text-muted-foreground">
              {camp?.name} · {FORMAT_LABEL[a.fmt]}
            </p>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Datos y guion */}
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Fecha">
                <input type="date" value={a.date} onChange={(e) => e.target.value && onChange({ date: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Hora">
                <input type="time" value={a.time ?? ''} onChange={(e) => onChange({ time: e.target.value || undefined })} className={inputCls} />
              </Field>
              <Field label="Formato">
                <select value={a.fmt} onChange={(e) => onChange({ fmt: e.target.value as ActionFormat })} className={inputCls}>
                  {(Object.keys(FORMAT_LABEL) as ActionFormat[]).map((f) => (
                    <option key={f} value={f}>
                      {FORMAT_LABEL[f]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Campaña">
                <select value={a.camp} onChange={(e) => onChange({ camp: e.target.value })} className={inputCls}>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Palabra clave">
                <input value={a.kw} onChange={(e) => onChange({ kw: e.target.value.toUpperCase() })} className={inputCls} placeholder="BLACK" />
              </Field>
              <Field label="Estado">
                <div className="grid h-11 grid-cols-3 gap-1 rounded-full bg-foreground/[0.07] p-1">
                  {(Object.keys(STATUS_LABEL) as ActionStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onChange({ status: st })}
                      className={cn('rounded-full text-[12px] font-semibold', a.status === st ? 'bg-foreground/15 text-foreground' : 'text-muted-foreground')}
                    >
                      {STATUS_LABEL[st]}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Gancho (la primera frase)">
              <input value={a.hook} onChange={(e) => onChange({ hook: e.target.value })} className={inputCls} />
            </Field>
            <Field
              label="Guion"
              action={
                <button type="button" onClick={() => copy(a.script, 'Guion')} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                  <Copy className="size-3.5" /> Copiar
                </button>
              }
            >
              <textarea value={a.script} onChange={(e) => onChange({ script: e.target.value })} rows={12} className={cn(inputCls, 'h-auto py-3 font-mono text-[13px] leading-relaxed')} />
            </Field>
            {a.fmt !== 'whatsapp' && a.fmt !== 'ads' && (
              <Field
                label="Texto de la publicación"
                action={
                  <button type="button" onClick={() => copy(a.caption ?? '', 'Texto')} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                    <Copy className="size-3.5" /> Copiar
                  </button>
                }
              >
                <textarea value={a.caption ?? ''} onChange={(e) => onChange({ caption: e.target.value })} rows={6} className={cn(inputCls, 'h-auto py-3 text-[15px]')} />
              </Field>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="secondary" className="h-11" onClick={onDuplicate}>
                <Copy /> Duplicar
              </Button>
              {confirmDel ? (
                <>
                  <Button variant="secondary" className="h-11" onClick={() => setConfirmDel(false)}>
                    No
                  </Button>
                  <Button className="h-11 bg-destructive text-white" onClick={onDelete}>
                    Sí, eliminar
                  </Button>
                </>
              ) : (
                <Button variant="destructive" className="h-11" onClick={() => setConfirmDel(true)}>
                  <Trash /> Eliminar acción
                </Button>
              )}
            </div>
          </div>

          {/* Láminas */}
          <div className="space-y-4 border-t border-border bg-foreground/[0.02] p-5 lg:border-t-0 lg:border-l">
            {!visual ? (
              <p className="rounded-[1.25rem] bg-card px-4 py-6 text-center text-[15px] text-muted-foreground">
                Esta acción no lleva imágenes. Cambia el formato a Carrusel o Historias para diseñarlas.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-title text-[1.25rem] font-bold">Láminas ({slides.length})</h3>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="h-10" onClick={addSlide}>
                      <Plus /> Lámina
                    </Button>
                    <Button className="h-10" disabled={!slides.length || !!exporting} onClick={exportAll}>
                      <DownloadSimple /> Descargar todas
                    </Button>
                  </div>
                </div>

                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSel(i)}
                      className={cn('rounded-[16px] p-0.5', i === sel ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100')}
                    >
                      <SlidePreview slide={s} photo={photoFor(s, i)} isLast={i === slides.length - 1} width={isStorySlide(s) ? 70 : 92} />
                    </button>
                  ))}
                </div>

                {current ? (
                  <div className="grid gap-4 xl:grid-cols-[auto_minmax(0,1fr)]">
                    <div className="mx-auto">
                      <SlidePreview slide={current} photo={photoFor(current, sel)} isLast={sel === slides.length - 1} width={isStorySlide(current) ? 230 : 300} />
                      <div className="mt-2 flex justify-center gap-2">
                        <IconBtn label="Mover a la izquierda" onClick={() => moveSlide(-1)}>
                          <ArrowLeft className="size-4" weight="bold" />
                        </IconBtn>
                        <IconBtn label="Descargar esta lámina" onClick={exportOne}>
                          <DownloadSimple className="size-4" weight="bold" />
                        </IconBtn>
                        <IconBtn label="Eliminar lámina" onClick={deleteSlide}>
                          <Trash className="size-4" weight="bold" />
                        </IconBtn>
                        <IconBtn label="Mover a la derecha" onClick={() => moveSlide(1)}>
                          <ArrowRight className="size-4" weight="bold" />
                        </IconBtn>
                      </div>
                    </div>
                    <div className="min-w-0 space-y-3">
                      <Field label="Plantilla">
                        <select value={current.tpl} onChange={(e) => patchSlide({ tpl: e.target.value as SlideTemplate })} className={inputCls}>
                          {(a.fmt === 'historias' ? STORY_TPL : CAROUSEL_TPL).map(([k, l]) => (
                            <option key={k} value={k}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Título (lo que va entre *asteriscos* sale en dorado)">
                        <textarea value={current.title} onChange={(e) => patchSlide({ title: e.target.value })} rows={2} className={cn(inputCls, 'h-auto py-2')} />
                      </Field>
                      {['cover', 'cta'].includes(current.tpl) && (
                        <Field label="Subtítulo">
                          <input value={current.subtitle ?? ''} onChange={(e) => patchSlide({ subtitle: e.target.value })} className={inputCls} />
                        </Field>
                      )}
                      {['point', 'story-countdown'].includes(current.tpl) && (
                        <Field label="Número o cifra">
                          <input value={current.number ?? ''} onChange={(e) => patchSlide({ number: e.target.value })} className={inputCls} />
                        </Field>
                      )}
                      {current.tpl !== 'story-poll' && (
                        <Field label={current.tpl === 'review' ? 'Reseña' : 'Texto'}>
                          <textarea value={current.body ?? ''} onChange={(e) => patchSlide({ body: e.target.value })} rows={3} className={cn(inputCls, 'h-auto py-2')} />
                        </Field>
                      )}
                      {current.tpl === 'point' && (
                        <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2">
                          <Field label="Etiqueta">
                            <input value={current.label ?? ''} onChange={(e) => patchSlide({ label: e.target.value })} className={inputCls} placeholder="LA VERDAD" />
                          </Field>
                          <Field label="Frase destacada">
                            <input value={current.highlight ?? ''} onChange={(e) => patchSlide({ highlight: e.target.value })} className={inputCls} />
                          </Field>
                        </div>
                      )}
                      {current.tpl === 'review' && (
                        <Field label="Autor">
                          <input value={current.author ?? ''} onChange={(e) => patchSlide({ author: e.target.value })} className={inputCls} placeholder="Angie · Google" />
                        </Field>
                      )}
                      {['cta', 'story-cta'].includes(current.tpl) && (
                        <Field label="Palabra clave">
                          <input value={current.kw ?? ''} onChange={(e) => patchSlide({ kw: e.target.value.toUpperCase() })} className={inputCls} />
                        </Field>
                      )}
                      {current.tpl === 'story-poll' && (
                        <div className="grid grid-cols-2 gap-2">
                          {[0, 1].map((k) => (
                            <Field key={k} label={`Opción ${k + 1}`}>
                              <input
                                value={current.options?.[k] ?? ''}
                                onChange={(e) => {
                                  const o: [string, string] = [...(current.options ?? ['', ''])] as [string, string]
                                  o[k] = e.target.value
                                  patchSlide({ options: o })
                                }}
                                className={inputCls}
                              />
                            </Field>
                          ))}
                        </div>
                      )}
                      {!['text', 'review'].includes(current.tpl) && (
                        <Field label="Foto de fondo (tus tatuajes)">
                          <div className="grid max-h-44 grid-cols-5 gap-1.5 overflow-y-auto rounded-xl">
                            <button
                              type="button"
                              onClick={() => patchSlide({ photo: undefined })}
                              className={cn(
                                'grid aspect-square place-items-center rounded-lg bg-foreground/[0.08] text-[11px] font-semibold',
                                !current.photo && 'ring-2 ring-primary',
                              )}
                            >
                              Auto
                            </button>
                            {gallery.map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => patchSlide({ photo: g })}
                                className={cn('aspect-square overflow-hidden rounded-lg', current.photo === g && 'ring-2 ring-primary')}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={g} alt="" loading="lazy" className="size-full object-cover grayscale" />
                              </button>
                            ))}
                          </div>
                        </Field>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Agrega la primera lámina.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lámina a tamaño real para exportar (fuera de pantalla). */}
        {exporting && (
          <div aria-hidden="true" style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none' }}>
            <SlideCanvas ref={exportRef} slide={exporting} photo={exporting.photo} isLast={slides[slides.length - 1]?.id === exporting.id} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const inputCls =
  'h-11 w-full rounded-xl border border-transparent bg-foreground/[0.07] px-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring'

function Field({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="flex items-center justify-between gap-2 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
        {action}
      </span>
      {children}
    </label>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-9 place-items-center rounded-full bg-foreground/[0.08] active:scale-90">
      {children}
    </button>
  )
}
