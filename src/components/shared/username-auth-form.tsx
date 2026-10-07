'use client'

import { useState, useTransition } from 'react'
import { signUpWithUsername, loginWithUsername } from '@/actions/auth'

export function UsernameAuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const action = mode === 'register' ? signUpWithUsername : loginWithUsername
      const result = await action(username, password)
      if (result.success) {
        // Redirección completa para asegurar que las cookies se propaguen
        window.location.href = result.data
      } else {
        setError(result.error.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Usuario"
        autoCapitalize="none"
        autoCorrect="off"
        required
        className="w-full rounded-xl border border-white/10 bg-card px-4 py-3.5 text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
        minLength={8}
        className="w-full rounded-xl border border-white/10 bg-card px-4 py-3.5 text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Un momento…' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
      </button>
    </form>
  )
}
