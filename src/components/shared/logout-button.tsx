import { LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import { cn } from '@/lib/utils'

/**
 * Botón "Cerrar sesión": form que invoca la server action `logout` (ya
 * hacía signOut + redirect a /login, solo faltaba conectarla a la UI).
 * Comparte el estilo de fila de NavLinks/SettingsNavLink; hover en rojo
 * destructivo para diferenciarla del resto de la navegación.
 */
export function LogoutButton({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        title={collapsed ? 'Cerrar sesión' : undefined}
        className={cn(
          'flex min-h-11 w-full items-center gap-3 rounded-md px-3.5 py-2.5 font-display text-[13px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          collapsed && 'justify-center px-0',
          className
        )}
      >
        <LogOut className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.6} />
        {!collapsed && 'Cerrar sesión'}
      </button>
    </form>
  )
}
