'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRating({
  value,
  onChange,
  disabled,
  size = 'default',
}: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: 'default' | 'sm'
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            strokeWidth={1.6}
            fill={n <= value ? 'currentColor' : 'none'}
            className={cn(
              size === 'sm' ? 'size-5' : 'size-7',
              n <= value ? 'text-primary' : 'text-muted-foreground/40'
            )}
          />
        </button>
      ))}
    </div>
  )
}
