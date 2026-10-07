'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { respondToInvitation } from '@/actions/collaborators'

export function StudioInviteResponse({
  invitationId,
  studioName,
}: {
  invitationId: string
  studioName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function respond(accept: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await respondToInvitation(invitationId, accept)
      if (!result.success) {
        setError(result.error.message)
        return
      }
      router.push(accept ? '/dashboard' : '/onboarding/choose')
    })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Logo full className="text-3xl" />

      <span className="grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
        <Building2 className="size-7" strokeWidth={1.7} aria-hidden="true" />
      </span>

      <div>
        <h1 className="font-title text-2xl uppercase">
          ¿Quieres unirte a <span className="text-primary">{studioName}</span>?
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Te invitaron como colaborador. Si aceptas, entras directo a su equipo.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(true)}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Un momento…' : 'Sí, unirme'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(false)}
          className="rounded-xl bg-card px-5 py-3 text-sm font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          No, gracias
        </button>
      </div>
    </div>
  )
}
