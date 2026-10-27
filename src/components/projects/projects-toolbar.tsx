'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ListBullets, MagnifyingGlass, SquaresFour } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/** Barra de Proyectos: buscador en píldora (?q=, con debounce) y el selector
 * cuadrícula/lista (?view=) como control segmentado de iOS. */
export function ProjectsToolbar() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const view = params.get('view') === 'list' ? 'list' : 'grid'
  const [q, setQ] = React.useState(params.get('q') ?? '')

  // Empuja `q` a la URL con debounce; el guard evita relanzar cuando ya coincide.
  React.useEffect(() => {
    const current = params.get('q') ?? ''
    if (q === current) return
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (q) next.set('q', q)
      else next.delete('q')
      router.replace(`${pathname}?${next.toString()}`)
    }, 250)
    return () => clearTimeout(t)
  }, [q, params, pathname, router])

  function setView(v: 'grid' | 'list') {
    const next = new URLSearchParams(params.toString())
    if (v === 'list') next.set('view', 'list')
    else next.delete('view')
    router.replace(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <MagnifyingGlass
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
          weight="bold"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar proyecto o cliente"
          aria-label="Buscar proyectos"
          className="h-12 w-full rounded-full bg-foreground/[0.08] pr-4 pl-11 text-[1.0625rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex h-12 shrink-0 gap-1 rounded-full bg-foreground/[0.08] p-1">
        {(
          [
            ['grid', SquaresFour, 'Vista de cuadrícula'],
            ['list', ListBullets, 'Vista de lista'],
          ] as const
        ).map(([v, Icon, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-label={label}
            aria-pressed={view === v}
            className={cn(
              'grid w-11 place-items-center rounded-full transition-[background-color,color] duration-150 ease-out',
              view === v ? 'bg-foreground/15 text-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" weight={view === v ? 'fill' : 'bold'} />
          </button>
        ))}
      </div>
    </div>
  )
}
