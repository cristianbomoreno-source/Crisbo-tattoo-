'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { addPlatformAdminByEmail, removePlatformAdmin, type PlatformAdminRow } from '@/actions/platform-admin'

export function ManageAdmins({ admins, myUserId }: { admins: PlatformAdminRow[]; myUserId: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await addPlatformAdminByEmail(email)
      if (!result.success) {
        setError(result.error.message)
        return
      }
      setEmail('')
      router.refresh()
    })
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removePlatformAdmin(userId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ofink.app"
          required
          className="min-w-0 flex-1 rounded-xl bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Agregar
        </button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="space-y-1.5">
        {admins.map((a) => (
          <div key={a.userId} className="flex items-center justify-between rounded-xl bg-background px-3.5 py-2.5">
            <span className="truncate text-sm">
              {a.email ?? a.userId} {a.userId === myUserId && <span className="text-xs text-muted-foreground">(tú)</span>}
            </span>
            {a.userId !== myUserId && (
              <button
                type="button"
                onClick={() => handleRemove(a.userId)}
                disabled={pending}
                aria-label="Quitar administrador"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" strokeWidth={1.8} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
