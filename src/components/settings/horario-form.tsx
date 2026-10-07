'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Info } from 'lucide-react'

import { updateStudioSchedule } from '@/actions/studio'
import { WEEK_DAYS, TIME_OPTIONS } from '@/components/onboarding/constants'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { cn } from '@/lib/utils'

type Props = { openDays: string[]; openTime: string; closeTime: string }

export function HorarioForm({ openDays: initialDays, openTime: initialOpen, closeTime: initialClose }: Props) {
  const router = useRouter()
  const [days, setDays] = useState<string[]>(initialDays)
  const [openTime, setOpenTime] = useState(initialOpen)
  const [closeTime, setCloseTime] = useState(initialClose)
  const [pending, startTransition] = useTransition()

  const dirty =
    JSON.stringify([...days].sort()) !== JSON.stringify([...initialDays].sort()) ||
    openTime !== initialOpen ||
    closeTime !== initialClose

  function toggleDay(day: string) {
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]))
  }

  function save() {
    if (days.length === 0) {
      toast.error('Selecciona al menos un día')
      return
    }
    startTransition(async () => {
      const result = await updateStudioSchedule({
        openDays: days,
        openTime: openTime || undefined,
        closeTime: closeTime || undefined,
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Horario actualizado')
      router.refresh()
    })
  }

  const selectClass =
    'w-full cursor-pointer appearance-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <SettingsSubpage title="Horario" description="Los días y horas en que trabajas.">
      <div className="space-y-6">
        <div>
          <div id="dias-label" className="mb-1.5 font-display text-xs font-medium uppercase tracking-wide text-foreground">
            Días de atención
          </div>
          <div className="flex gap-1.5" role="group" aria-labelledby="dias-label">
            {WEEK_DAYS.map((day) => {
              const active = days.includes(day.value)
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg border font-display text-[0.65rem] font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {day.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="open-time" className="mb-1.5 block font-display text-xs font-medium uppercase tracking-wide text-foreground">
              Apertura
            </label>
            <select id="open-time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={selectClass}>
              <option value="">—</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="close-time" className="mb-1.5 block font-display text-xs font-medium uppercase tracking-wide text-foreground">
              Cierre
            </label>
            <select id="close-time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={selectClass}>
              <option value="">—</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-2xl bg-card/40 p-3.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
          Tu calendario y tu ocupación usan este horario para calcular la disponibilidad.
        </p>
      </div>
      <SettingsSaveBar dirty={dirty} saving={pending} onSave={save} />
    </SettingsSubpage>
  )
}
