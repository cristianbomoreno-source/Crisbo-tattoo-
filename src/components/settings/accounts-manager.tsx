'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserRound, Building2, Check, ArrowRight } from 'lucide-react'
import { setActiveAccount, type MyAccount } from '@/actions/accounts'
import { cn } from '@/lib/utils'

export function AccountsManager({ accounts }: { accounts: MyAccount[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasTatuador = accounts.some((a) => a.accountKind === 'tatuador')
  const hasEstudio = accounts.some((a) => a.accountKind === 'estudio')
  const canCreateEstudio = accounts.length < 2 && !hasEstudio
  const canCreateTatuador = accounts.length < 2 && !hasTatuador

  function handleSwitch(artistId: string) {
    setError(null)
    setSwitching(artistId)
    startTransition(async () => {
      const result = await setActiveAccount(artistId)
      if (!result.success) {
        setError(result.error.message)
        setSwitching(null)
        return
      }
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Con tu mismo login de Google puedes tener hasta 2 cuentas OFINK: una como tatuador
        independiente y otra como dueño de un estudio.
      </p>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-3">
        {accounts.map((account) => {
          const Icon = account.accountKind === 'estudio' ? Building2 : UserRound
          return (
            <div
              key={account.artistId}
              className={cn(
                'flex items-center gap-3.5 rounded-2xl border bg-card p-4',
                account.isActive ? 'border-primary/60' : 'border-border/60'
              )}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5.5" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{account.studioName}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {account.accountKind === 'estudio' ? 'Estudio' : 'Tatuador'}
                </p>
              </div>
              {account.isActive ? (
                <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                  Activa
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSwitch(account.artistId)}
                  disabled={pending}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending && switching === account.artistId ? 'Cambiando…' : 'Usar esta'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {(canCreateEstudio || canCreateTatuador) && (
        <div className="rounded-2xl border border-dashed border-border/60 p-4">
          <p className="mb-3 text-sm font-semibold">
            {canCreateEstudio ? 'Crea también tu cuenta de estudio' : 'Crea también tu cuenta de tatuador'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canCreateEstudio && (
              <Link
                href="/onboarding/estudio"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Crear cuenta de Estudio
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
              </Link>
            )}
            {canCreateTatuador && (
              <Link
                href="/onboarding"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-card px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              >
                Crear cuenta de Tatuador
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
