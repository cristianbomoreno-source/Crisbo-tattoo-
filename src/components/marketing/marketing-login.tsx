'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithUsername } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

/** Entrada a /marketing con el usuario y la contraseña de la app. */
export function MarketingLogin() {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form
        className="w-full max-w-sm space-y-5 rounded-[2rem] bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          start(async () => {
            const res = await loginWithUsername(user, pass)
            if (!res.success) return setError(res.error.message)
            router.refresh()
          })
        }}
      >
        <div className="space-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/cb-isotipo-mark.png" alt="" className="mb-3 h-12 w-auto" />
          <h1 className="large-title">Marketing</h1>
          <p className="text-[15px] text-muted-foreground">Entra con tu usuario y contraseña de Crisbo Tattoo.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mk-user">Usuario</Label>
          <Input id="mk-user" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mk-pass">Contraseña</Label>
          <Input id="mk-pass" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required />
        </div>
        {error && <p className="text-[15px] font-semibold text-destructive">{error}</p>}
        <Button type="submit" className="h-12 w-full text-[1.0625rem]" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  )
}
