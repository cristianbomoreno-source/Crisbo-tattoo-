'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { HelpCircle, ImagePlus, ImageOff, X, Check } from 'lucide-react'
import {
  INTAKE_SIZES, INTAKE_COLORS, INTAKE_SKIN_TONES,
  INTAKE_MAX_PHOTOS, INTAKE_PHOTO_MAX_BYTES, INTAKE_PHOTO_TYPES,
} from '@/lib/validations/intake'
import { COPY } from './copy'

/* Tamaño: cuadrado lima que crece sobre fondo oscuro — escala sin figuras humanas. */
const SIZE_SQUARE_PX = [0, 10, 18, 28, 40, 56] // índice alineado con INTAKE_SIZES

export function SizeCards({ onPick }: { onPick: (v: string) => void }) {
  return (
    <div className="grid w-full flex-1 min-h-0 grid-cols-2 content-start gap-2.5 overflow-y-auto py-0.5">
      {INTAKE_SIZES.map((size, i) => (
        <button
          key={size}
          type="button"
          onClick={() => onPick(size)}
          className="flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border border-white/8 bg-card p-3.5 text-center transition-all active:scale-[0.97] hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="flex size-14 items-center justify-center rounded-xl bg-background">
            {i === 0 ? (
              <HelpCircle className="size-6 text-muted-foreground" aria-hidden />
            ) : (
              <span
                className="rounded-[2px] bg-primary"
                style={{ width: SIZE_SQUARE_PX[i], height: SIZE_SQUARE_PX[i] }}
                aria-hidden
              />
            )}
          </span>
          <span className="text-center text-xs leading-tight text-white/90">{size}</span>
        </button>
      ))}
    </div>
  )
}

/* Color vs negro: tarjetas apiladas con swatch + subtítulo, como el mockup
 * "¿Cómo te lo imaginas?". Los valores enviados (INTAKE_COLORS) no cambian,
 * solo la etiqueta/descripción visible. */
// Tipado contra INTAKE_COLORS a propósito: si mañana se agrega un color al
// catálogo y se olvida agregarlo acá, esto no compila. Con `Record<string, ...>`
// el color nuevo salía `undefined` y reventaba la pantalla del bot en `p.bg`.
const COLOR_PRESENTATION: Record<
  (typeof INTAKE_COLORS)[number],
  { label: string; subtitle: string; bg: string }
> = {
  Negro: {
    label: 'Black & Grey',
    subtitle: 'Sombras y contraste',
    bg: 'linear-gradient(135deg, #f4f2f0 0%, #6a6764 55%, #161616 100%)',
  },
  Color: {
    label: 'A color',
    subtitle: 'Colores vivos y realistas',
    bg: 'conic-gradient(from 0deg, #E63946, #D6A23E, #62A878, #5B8CB0, #9B7FB8, #E63946)',
  },
  'No lo sé': {
    label: 'No estoy seguro',
    subtitle: 'Aún quiero pensarlo',
    bg: '',
  },
}

export function ColorCards({ onPick }: { onPick: (v: string) => void }) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      {INTAKE_COLORS.map(color => {
        const p = COLOR_PRESENTATION[color]
        return (
          <button
            key={color}
            type="button"
            onClick={() => onPick(color)}
            className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/8 bg-card p-3 text-left transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background">
              {color === 'No lo sé' ? (
                <HelpCircle className="size-6 text-muted-foreground" aria-hidden />
              ) : (
                <span className="size-full" style={{ background: p.bg }} aria-hidden />
              )}
            </span>
            <span className="flex-1">
              <span className="block font-heading text-sm font-semibold uppercase tracking-wide text-white">
                {p.label}
              </span>
              <span className="block text-xs text-muted-foreground">{p.subtitle}</span>
            </span>
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/15 text-transparent transition-colors group-active:border-primary group-active:bg-primary group-active:text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* Tono de piel: swatches reales + opción de no decir. */
export function SkinSwatches({ onPick }: { onPick: (v: string) => void }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid w-full grid-cols-3 gap-2.5">
        {INTAKE_SKIN_TONES.map(tone => (
          <button
            key={tone.label}
            type="button"
            onClick={() => onPick(tone.label)}
            aria-label={`Tono de piel ${tone.label}`}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-white/8 bg-card p-2.5 transition-all active:scale-[0.97] hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span
              className="h-12 w-full rounded-xl"
              style={{ backgroundColor: tone.hex }}
              aria-hidden
            />
            <span className="text-xs text-white/90">{tone.label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPick('Prefiero no decir')}
        className="w-full cursor-pointer rounded-2xl border border-white/8 bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-white focus-visible:outline-2 focus-visible:outline-ring"
      >
        Prefiero no decir
      </button>
    </div>
  )
}

/* Fotos de referencia: hasta 3, con preview y quitar. Filtra tipo y peso. */
export function PhotoPicker({ onDone }: { onDone: (files: File[]) => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [warning, setWarning] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Blob URLs estables: se crean una vez por cambio de archivos y se revocan al limpiar.
  const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files])
  useEffect(() => {
    return () => previews.forEach(u => URL.revokeObjectURL(u))
  }, [previews])

  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list)
    const accepted: File[] = [...files]
    let rejectedInvalid = 0
    let overflow = 0
    for (const f of incoming) {
      const okType = (INTAKE_PHOTO_TYPES as readonly string[]).includes(f.type)
      if (!okType || f.size > INTAKE_PHOTO_MAX_BYTES) {
        rejectedInvalid += 1
        continue
      }
      if (accepted.length >= INTAKE_MAX_PHOTOS) {
        overflow += 1
        continue
      }
      accepted.push(f)
    }
    setFiles(accepted)
    setWarning(
      overflow > 0
        ? `Máximo ${INTAKE_MAX_PHOTOS} imágenes.`
        : rejectedInvalid > 0
          ? 'Solo JPG, PNG o WebP de máximo 5 MB.'
          : null
    )
  }

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={INTAKE_PHOTO_TYPES.join(',')}
        multiple
        hidden
        onChange={e => addFiles(e.target.files)}
      />
      <div className="grid flex-1 min-h-0 grid-cols-2 gap-2.5 overflow-y-auto">
        {files.map((f, i) => (
          <span key={i} className="relative aspect-square overflow-hidden rounded-2xl border border-white/8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async"
              src={previews[i]}
              alt={`Referencia ${i + 1}`}
              className="size-full object-cover"
            />
            <button
              type="button"
              aria-label={`Quitar referencia ${i + 1}`}
              onClick={() => setFiles(files.filter((_, j) => j !== i))}
              className="absolute right-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
        {files.length < INTAKE_MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ImagePlus className="size-6" aria-hidden />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-wide">Agregar más</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {warning ?? (files.length > 0 ? `${files.length} imagen${files.length > 1 ? 'es' : ''} agregada${files.length > 1 ? 's' : ''}` : `Máximo ${INTAKE_MAX_PHOTOS} imágenes · JPG, PNG o WebP`)}
        </p>
      </div>

      {files.length > 0 ? (
        <button
          type="button"
          onClick={() => onDone(files)}
          className="ml-auto flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-heading text-xs uppercase tracking-wide text-primary-foreground transition-all active:scale-95"
        >
          <Check className="size-3.5" strokeWidth={3} aria-hidden /> Listo
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onDone(files)}
          className="flex shrink-0 items-center justify-center gap-1.5 py-1 text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          <ImageOff className="size-3.5" aria-hidden /> {COPY.noPhotos}
        </button>
      )}
    </div>
  )
}
