'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, X } from 'lucide-react'
import { respondToInvitation, type MyInvitation } from '@/actions/collaborators'

export function InvitationBanner({ invitations }: { invitations: MyInvitation[] }) {
  const router = useRouter()
  const [list, setList] = useState(invitations)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [respondingId, setRespondingId] = useState<string | null>(null)

  if (list.length === 0) return null

  function respond(id: string, accept: boolean) {
    setError(null)
    setRespondingId(id)
    startTransition(async () => {
      const result = await respondToInvitation(id, accept)
      if (!result.success) {
        setError(result.error.message)
        setRespondingId(null)
        return
      }
      setList((prev) => prev.filter((i) => i.id !== id))
      if (accept) {
        router.push('/dashboard')
      }
      router.refresh()
    })
  }

  return (
    <div className="mb-5 space-y-3">
      {list.map((inv) => (
        <div key={inv.id} className="flex items-center gap-3.5 rounded-2xl border border-primary/25 bg-card p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
            <Building2 className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-semibold">{inv.studioName}</span> te invitó a unirte como
              colaborador.
            </p>
            {error && respondingId === inv.id && (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => respond(inv.id, true)}
              aria-label="Aceptar invitación"
              className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Check className="size-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => respond(inv.id, false)}
              aria-label="Rechazar invitación"
              className="grid size-9 place-items-center rounded-full bg-background text-muted-foreground disabled:opacity-50"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
