'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserRound, Building2, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { setActiveAccount } from '@/actions/accounts'
import type { MyAccount } from '@/actions/accounts'

/**
 * Se muestra cuando el usuario tiene sus 2 cuentas OFINK (una 'tatuador' y
 * otra 'estudio') y acaba de entrar con Google — ver /auth/callback y
 * /onboarding/select-account. Cada login vuelve a preguntar cuál usar.
 */
export function SelectAccountScreen({ accounts }: { accounts: MyAccount[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSelect(artistId: string) {
    setError(null)
    setSelecting(artistId)
    startTransition(async () => {
      const result = await setActiveAccount(artistId)
      if (!result.success) {
        setError(result.error.message)
        setSelecting(null)
        return
      }
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex justify-center pt-10 pb-6 sm:pt-14">
        <Logo full className="text-4xl" />
      </div>

      <div className="px-4 pb-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ¿Con cuál <span className="text-primary">cuenta</span> quieres entrar?
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Tienes 2 cuentas OFINK con este mismo login de Google.
        </p>
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-6">
        {accounts.map((account) => (
          <AccountCard
            key={account.artistId}
            icon={account.accountKind === 'estudio' ? Building2 : UserRound}
            title={account.accountKind === 'estudio' ? 'Estudio' : 'Tatuador'}
            studioName={account.studioName}
            cta={pending && selecting === account.artistId ? 'Entrando…' : `Continuar como ${account.accountKind}`}
            disabled={pending}
            onClick={() => handleSelect(account.artistId)}
          />
        ))}
      </div>
    </div>
  )
}

function AccountCard({
  icon: Icon,
  title,
  studioName,
  cta,
  disabled,
  onClick,
}: {
  icon: React.ElementType
  title: string
  studioName: string
  cta: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex min-h-[15rem] flex-1 cursor-pointer flex-col justify-end overflow-hidden rounded-[2rem] border border-white/10 bg-card p-6 text-left transition-all hover:border-primary/50 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[26rem] sm:p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/95 to-primary/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]"
      >
        <Icon className="size-56 text-primary" strokeWidth={1} />
      </div>

      <div className="relative z-10">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="size-7" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-title text-2xl uppercase leading-none sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-xs truncate text-sm text-muted-foreground">{studioName}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-xs font-bold uppercase tracking-wide text-primary-foreground transition-transform group-hover:translate-x-0.5">
          {cta}
          <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
        </div>
      </div>
    </button>
  )
}
