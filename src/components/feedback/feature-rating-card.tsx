'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { FeaturePreview } from '@/components/feedback/feature-preview'
import { StarRating } from '@/components/feedback/star-rating'
import { rateFeature } from '@/actions/feedback'
import type { FeatureItem } from '@/lib/feedback/features'

export function FeatureRatingCard({
  feature,
  initial,
}: {
  feature: FeatureItem
  initial?: { rating: number; comment: string | null }
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [saved, setSaved] = useState(!!initial?.rating)
  const [pending, startTransition] = useTransition()

  function handleRate(value: number) {
    setRating(value)
    setSaved(false)
    startTransition(async () => {
      const result = await rateFeature(feature.key, value, comment)
      if (result.success) setSaved(true)
    })
  }

  function handleCommentBlur() {
    if (!rating) return
    startTransition(async () => {
      const result = await rateFeature(feature.key, rating, comment)
      if (result.success) setSaved(true)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 sm:flex-row">
      <FeaturePreview kind={feature.preview} screenshot={feature.screenshot} />

      <div className="min-w-0 flex-1 space-y-2.5">
        <div>
          <p className="text-sm font-semibold">{feature.label}</p>
          <p className="text-xs text-muted-foreground">{feature.description}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <StarRating value={rating} onChange={handleRate} disabled={pending} />
          {saved && !pending && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Check className="size-3.5" strokeWidth={2.5} /> Guardado
            </span>
          )}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={handleCommentBlur}
          placeholder="Escribe tu retroalimentación sobre esta función (opcional)"
          rows={2}
          className="w-full rounded-xl bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  )
}
