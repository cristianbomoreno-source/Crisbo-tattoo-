import Link from 'next/link'
import { BarChart3, ChevronRight, ClipboardList, FileSignature, Images, Users, Wallet, type LucideIcon } from 'lucide-react'

type Module = { href: string; icon: LucideIcon; label: string; hint: string; tour?: string; ownerOnly?: boolean }

const MODULES: Module[] = [
  { href: '/dashboard/quotes', icon: ClipboardList, label: 'Cotizaciones', hint: 'Solicitudes, rápidas y formales', tour: 'nav-quotes-mobile' },
  { href: '/dashboard?caja=1', icon: Wallet, label: 'Caja y cuentas', hint: 'Saldos, movimientos y gastos fijos', ownerOnly: true },
  { href: '/dashboard/clients', icon: Users, label: 'Clientes', hint: 'Fichas, historial y contacto' },
  { href: '/dashboard/consents', icon: FileSignature, label: 'Consentimientos', hint: 'Firmados y por firmar' },
  { href: '/dashboard/gallery', icon: Images, label: 'Galería', hint: 'Tu trabajo publicado' },
  { href: '/dashboard/stats', icon: BarChart3, label: 'Estadísticas', hint: 'Ingresos, citas y redes', ownerOnly: true },
]

/**
 * Pestaña "Estudio" en el celular: la barra inferior solo tiene Inicio,
 * Proyectos, Mensajes y Estudio, así que aquí arriba van los módulos que en
 * escritorio están en el sidebar. En escritorio no se muestra (lg:hidden).
 */
export function StudioModules({ isOwner }: { isOwner: boolean }) {
  const items = MODULES.filter((m) => isOwner || !m.ownerOnly)
  return (
    <section className="lg:hidden" aria-labelledby="studio-modules-title">
      <h2 id="studio-modules-title" className="mb-2 px-1 text-sm font-semibold">
        Tu estudio
      </h2>
      <nav className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card">
        {items.map(({ href, icon: Icon, label, hint, tour }) => (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors active:bg-muted/60"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground/80">
              <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium leading-tight">{label}</span>
              <span className="block truncate text-[13px] text-muted-foreground">{hint}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </section>
  )
}
