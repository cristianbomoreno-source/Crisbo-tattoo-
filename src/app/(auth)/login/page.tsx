import { UsernameAuthForm } from '@/components/shared/username-auth-form'

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Crisbo <span className="text-primary">Tattoo</span>
        </h1>
        <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-primary" aria-hidden="true" />
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          Inicia sesión con tu usuario y contraseña.
        </p>
      </div>

      <UsernameAuthForm mode="login" />
    </div>
  )
}
