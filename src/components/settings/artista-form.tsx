'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

import { updateArtistProfile } from '@/actions/studio'
import { EXPERIENCE_RANGES } from '@/components/onboarding/constants'
import { INTAKE_STYLES } from '@/lib/validations/intake'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const STYLE_OPTIONS = INTAKE_STYLES.filter((s) => s !== 'Otro' && s !== 'No lo sé')

type Props = {
  name: string
  styles: string[]
  experienceRange: string
  fullTime: boolean | undefined
  ownStudio: boolean | undefined
}

export function ArtistaForm({ name: iName, styles: iStyles, experienceRange: iExp, fullTime: iFull, ownStudio: iOwn }: Props) {
  const router = useRouter()
  const [name, setName] = useState(iName)
  const [styles, setStyles] = useState<string[]>(iStyles)
  const [experienceRange, setExperienceRange] = useState(iExp)
  const [fullTime, setFullTime] = useState<boolean | undefined>(iFull)
  const [ownStudio, setOwnStudio] = useState<boolean | undefined>(iOwn)
  const [pending, startTransition] = useTransition()

  const dirty =
    name !== iName ||
    JSON.stringify([...styles].sort()) !== JSON.stringify([...iStyles].sort()) ||
    experienceRange !== iExp ||
    fullTime !== iFull ||
    ownStudio !== iOwn

  function toggleStyle(style: string) {
    setStyles((s) => (s.includes(style) ? s.filter((x) => x !== style) : [...s, style]))
  }

  function save() {
    if (name.trim().length < 2) {
      toast.error('Cuéntanos tu nombre')
      return
    }
    startTransition(async () => {
      const result = await updateArtistProfile({
        name,
        styles,
        experienceRange: experienceRange || undefined,
        fullTime,
        ownStudio,
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Perfil de artista actualizado')
      router.refresh()
    })
  }

  const selectClass =
    'w-full cursor-pointer appearance-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <SettingsSubpage title="Tu perfil de artista" description="Nombre, especialidad y experiencia.">
      <div className="space-y-6">
        <div>
          <label htmlFor="artist-name" className="mb-1.5 block font-display text-xs font-medium uppercase tracking-wide text-foreground">
            ¿Cómo te llamas?
          </label>
          <Input id="artist-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
        </div>

        <div>
          <div className="mb-2 font-display text-xs font-medium uppercase tracking-wide text-foreground">Estilos que tatúas</div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {STYLE_OPTIONS.map((style) => {
              const active = styles.includes(style)
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleStyle(style)}
                  aria-pressed={active}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  )}
                >
                  <span className={cn('font-display text-xs font-medium uppercase tracking-wide', active ? 'text-primary' : 'text-foreground')}>
                    {style}
                  </span>
                  {active && <Check className="size-3.5 shrink-0 text-primary" strokeWidth={3} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="artist-exp" className="mb-1.5 block font-display text-xs font-medium uppercase tracking-wide text-foreground">
            Años de experiencia
          </label>
          <select id="artist-exp" value={experienceRange} onChange={(e) => setExperienceRange(e.target.value)} className={selectClass}>
            <option value="">Sin definir</option>
            {EXPERIENCE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ThreeStateToggle
            label="¿Tatúas a tiempo completo?"
            value={fullTime}
            onChange={setFullTime}
          />
          <ThreeStateToggle
            label="¿Trabajas en estudio propio?"
            value={ownStudio}
            onChange={setOwnStudio}
          />
        </div>
      </div>
      <SettingsSaveBar dirty={dirty} saving={pending} onSave={save} />
    </SettingsSubpage>
  )
}

/** Sí / No con opción de "sin responder" (undefined) — dos botones; volver a
 * pulsar el activo lo deja en undefined (el campo es opcional). */
function ThreeStateToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | undefined
  onChange: (v: boolean | undefined) => void
}) {
  return (
    <div>
      <div className="mb-1.5 font-display text-xs font-medium uppercase tracking-wide text-foreground">{label}</div>
      <div className="flex gap-2">
        {([
          { v: true, t: 'Sí' },
          { v: false, t: 'No' },
        ]).map(({ v, t }) => {
          const active = value === v
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(active ? undefined : v)}
              aria-pressed={active}
              className={cn(
                'h-10 flex-1 cursor-pointer rounded-md border font-display text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              {t}
            </button>
          )
        })}
      </div>
    </div>
  )
}
