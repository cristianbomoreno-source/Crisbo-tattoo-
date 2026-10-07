'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { GripVertical, ChevronDown, Trash2, Eye, EyeOff, Plus } from 'lucide-react'
import {
  createStudioLink,
  updateStudioLink,
  deleteStudioLink,
  reorderStudioLinks,
  type StudioLink,
} from '@/actions/studio-links'
import { LINK_ICON_OPTIONS, iconFor } from '@/lib/link-page/theme'
import { cn } from '@/lib/utils'

function LinkRow({
  link,
  index,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverIndex,
}: {
  link: StudioLink
  index: number
  onChange: (id: string, patch: Partial<StudioLink>) => void
  onDelete: (id: string) => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: () => void
  dragOverIndex: number | null
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = iconFor(link.icon)

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(index)
      }}
      onDrop={onDrop}
      className={cn(
        'rounded-xl bg-background transition-colors',
        dragOverIndex === index && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing">
          <GripVertical className="size-4" />
        </span>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: `${link.color ?? '#888888'}22`, color: link.color ?? '#888888' }}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="min-w-0 flex-1 truncate text-left text-sm font-medium">
          {link.label || 'Sin nombre'}
        </button>
        <button type="button" onClick={() => onChange(link.id, { enabled: !link.enabled })} className="text-muted-foreground">
          {link.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
        <button type="button" onClick={() => onDelete(link.id)} className="text-destructive">
          <Trash2 className="size-4" />
        </button>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-muted-foreground">
          <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-border/60 p-3">
          <input
            value={link.label}
            onChange={(e) => onChange(link.id, { label: e.target.value })}
            placeholder="Nombre"
            className="w-full rounded-lg bg-card px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            value={link.subtitle ?? ''}
            onChange={(e) => onChange(link.id, { subtitle: e.target.value || null })}
            placeholder="Subtítulo (opcional)"
            className="w-full rounded-lg bg-card px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            value={link.url}
            onChange={(e) => onChange(link.id, { url: e.target.value })}
            placeholder="https://…"
            className="w-full rounded-lg bg-card px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Color</span>
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(link.color ?? '') ? (link.color as string) : '#A8FF60'}
              onChange={(e) => onChange(link.id, { color: e.target.value })}
              className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LINK_ICON_OPTIONS.map((opt) => {
              const OptIcon = opt.icon
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onChange(link.id, { icon: opt.key })}
                  aria-label={opt.label}
                  className={cn(
                    'grid size-8 place-items-center rounded-lg border-2 transition-colors',
                    link.icon === opt.key ? 'border-primary text-primary' : 'border-transparent bg-card text-muted-foreground'
                  )}
                >
                  <OptIcon className="size-4" strokeWidth={1.8} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function LinkPageLinksEditor({ initialLinks }: { initialLinks: StudioLink[] }) {
  const [links, setLinks] = useState(initialLinks)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  function patchLocal(id: string, patch: Partial<StudioLink>) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  async function handleChange(id: string, patch: Partial<StudioLink>) {
    patchLocal(id, patch)
    const result = await updateStudioLink(id, patch)
    if (!result.success) toast.error(result.error.message)
  }

  async function handleDelete(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id))
    const result = await deleteStudioLink(id)
    if (!result.success) toast.error(result.error.message)
  }

  async function handleAdd() {
    if (!label.trim() || !url.trim()) return
    setAdding(true)
    const result = await createStudioLink({ label, url })
    setAdding(false)
    if (!result.success) return toast.error(result.error.message)
    setLinks((prev) => [...prev, result.data])
    setLabel('')
    setUrl('')
  }

  function handleDrop() {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const next = [...links]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(dragOverIndex, 0, moved!)
    setLinks(next)
    setDragIndex(null)
    setDragOverIndex(null)
    reorderStudioLinks(next.map((l) => l.id)).then((result) => {
      if (!result.success) toast.error(result.error.message)
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Arrastra desde el ícono ⠿ para reordenar. Toca un enlace para editarlo.</p>

      <div className="space-y-2">
        {links.map((link, i) => (
          <LinkRow
            key={link.id}
            link={link}
            index={i}
            onChange={handleChange}
            onDelete={handleDelete}
            onDragStart={setDragIndex}
            onDragOver={setDragOverIndex}
            onDrop={handleDrop}
            dragOverIndex={dragOverIndex}
          />
        ))}
        {links.length === 0 && (
          <p className="rounded-xl bg-background px-4 py-6 text-center text-xs text-muted-foreground">
            Todavía no agregas enlaces.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-card p-3.5">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nombre (ej. Portafolio)"
          className="w-full rounded-lg bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          disabled={adding}
          onClick={handleAdd}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-4" /> Agregar enlace
        </button>
      </div>
    </div>
  )
}
