import Link from 'next/link'
import { GoogleAuthButton } from '@/components/shared/google-auth-button'
import { UsernameAuthForm } from '@/components/shared/username-auth-form'

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Crea <span className="text-primary">tu cuenta</span>
        </h1>
        <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-primary" aria-hidden="true" />
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          Organiza clientes, cotizaciones y agenda desde un solo lugar.
        </p>
      </div>

      <UsernameAuthForm mode="register" />

      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        o
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleAuthButton />

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
