import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Pestañas de Estadísticas: números del estudio | redes y ventas. */
export function StatsTabs({ active }: { active: 'negocio' | 'redes' }) {
  const tabs = [
    { key: 'negocio', href: '/dashboard/stats', label: 'Estudio' },
    { key: 'redes', href: '/dashboard/stats/redes', label: 'Redes y ventas' },
  ] as const
  return (
    <nav className="inline-flex rounded-full bg-card p-1 ring-1 ring-foreground/5" aria-label="Secciones de estadísticas">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? 'page' : undefined}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            active === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
