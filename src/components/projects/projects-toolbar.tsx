'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, LayoutGrid, List } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/** Barra de Proyectos: búsqueda server (?q=) con debounce + toggle cuadrícula/lista (?view=). */
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
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.7}
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar proyecto o cliente…"
          className="pl-8"
          aria-label="Buscar proyectos"
        />
      </div>

      <div className="flex shrink-0 gap-0.5 rounded-lg border p-0.5">
        <Button
          type="button"
          variant={view === 'grid' ? 'default' : 'ghost'}
          size="icon-sm"
          onClick={() => setView('grid')}
          aria-label="Vista de cuadrícula"
          aria-pressed={view === 'grid'}
        >
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          type="button"
          variant={view === 'list' ? 'default' : 'ghost'}
          size="icon-sm"
          onClick={() => setView('list')}
          aria-label="Vista de lista"
          aria-pressed={view === 'list'}
        >
          <List className="size-4" />
        </Button>
      </div>
    </div>
  )
}
