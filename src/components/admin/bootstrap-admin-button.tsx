'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bootstrapFirstAdmin } from '@/actions/platform-admin'

export function BootstrapAdminButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await bootstrapFirstAdmin()
            if (!result.success) {
              setError(result.error.message)
              return
            }
            router.refresh()
          })
        }
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Un momento…' : 'Reclamar acceso de administrador'}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
