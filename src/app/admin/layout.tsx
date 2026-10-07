import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin, hasAnyPlatformAdmin } from '@/actions/platform-admin'
import { BootstrapAdminButton } from '@/components/admin/bootstrap-admin-button'
import { Logo } from '@/components/shared/logo'

export const metadata = {
  robots: { index: false, follow: false },
}


/**
 * /admin es la administración de Crisbo Tattoo para el equipo creador —
 * separada por completo del dashboard de los tatuadores (otro layout,
 * sin bottom nav ni pulpo). El acceso se controla con la tabla
 * `platform_admins` (sin policies para clientes — ver actions/platform-admin.ts).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirigir a login si no hay sesión
    redirect('/login')
  }

  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) {
    const anyAdmin = await hasAnyPlatformAdmin()
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <Logo full className="text-3xl" />
        {anyAdmin ? (
          <>
            <h1 className="font-title text-2xl uppercase">Sin acceso</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Tu cuenta no es administradora de OFINK. Pide a un administrador que te agregue
              desde esta misma pantalla, con el correo {user.email}.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-title text-2xl uppercase">Primer arranque</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Todavía no hay administradores registrados. Reclama el acceso con esta cuenta
              ({user.email}) para empezar.
            </p>
            <BootstrapAdminButton />
          </>
        )}
        <Link href="/dashboard" className="text-xs text-muted-foreground underline">
          Volver al dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/60 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="text-xl" />
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
              Admin
            </span>
          </div>
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
            Volver al dashboard →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  )
}
