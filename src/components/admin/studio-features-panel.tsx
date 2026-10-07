'use client'

import { useState, useTransition } from 'react'
import { getStudioFeatureToggles, setStudioFeature, type StudioOption } from '@/actions/platform-admin'
import type { FeatureKey } from '@/lib/features/catalog'
import { cn } from '@/lib/utils'

type Toggle = { key: FeatureKey; label: string; enabled: boolean }

export function StudioFeaturesPanel({ studios }: { studios: StudioOption[] }) {
  const [studioId, setStudioId] = useState('')
  const [toggles, setToggles] = useState<Toggle[] | null>(null)
  const [loading, startLoading] = useTransition()
  const [saving, startSaving] = useTransition()

  function handlePick(id: string) {
    setStudioId(id)
    setToggles(null)
    if (!id) return
    startLoading(async () => {
      const result = await getStudioFeatureToggles(id)
      setToggles(result.success ? result.data : [])
    })
  }

  function handleToggle(key: FeatureKey, next: boolean) {
    setToggles((prev) => prev?.map((t) => (t.key === key ? { ...t, enabled: next } : t)) ?? prev)
    startSaving(async () => {
      await setStudioFeature(studioId, key, next)
    })
  }

  return (
    <div className="space-y-4">
      <select
        value={studioId}
        onChange={(e) => handlePick(e.target.value)}
        className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Elige un estudio/cuenta…</option>
        {studios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {toggles && (
        <div className="space-y-1.5">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-3 rounded-xl bg-background px-3.5 py-2.5">
              <span className="text-sm">{t.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={t.enabled}
                disabled={saving}
                onClick={() => handleToggle(t.key, !t.enabled)}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
                  t.enabled ? 'bg-primary' : 'bg-white/15'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-5 rounded-full bg-white transition-transform',
                    t.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
