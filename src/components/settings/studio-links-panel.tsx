'use client'

import { useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, Eye, EyeOff } from 'lucide-react'
import {
  createStudioLink,
  updateStudioLink,
  deleteStudioLink,
  moveStudioLink,
  type StudioLink,
} from '@/actions/studio-links'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const emptySubscribe = () => () => {}
const getOrigin = () => window.location.origin
const getServerOrigin = () => ''

export function StudioLinksPanel({ slug, initialLinks }: { slug: string; initialLinks: StudioLink[] }) {
  const [links, setLinks] = useState(initialLinks)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const origin = useSyncExternalStore(emptySubscribe, getOrigin, getServerOrigin)
  const publicUrl = `${origin}/l/${slug}`

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

  async function handleToggle(link: StudioLink) {
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, enabled: !l.enabled } : l)))
    const result = await updateStudioLink(link.id, { enabled: !link.enabled })
    if (!result.success) toast.error(result.error.message)
  }

  async function handleDelete(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id))
    const result = await deleteStudioLink(id)
    if (!result.success) toast.error(result.error.message)
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const index = links.findIndex((l) => l.id === id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= links.length) return
    const next = [...links]
    ;[next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!]
    setLinks(next)
    const result = await moveStudioLink(id, direction)
    if (!result.success) toast.error(result.error.message)
  }

  function copyPublicUrl() {
    navigator.clipboard.writeText(publicUrl)
    toast.success('Enlace copiado')
  }

  return (
    <div className="mt-8 space-y-4 border-t border-border/60 pt-8">
      <div>
        <h2 className="font-title text-lg uppercase">Tu página de enlaces</h2>
        <p className="text-xs text-muted-foreground">
          Una sola página pública, personalizable, con todos tus enlaces — estilo Linktree.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-3">
        <span className="flex-1 truncate text-sm text-muted-foreground">{publicUrl}</span>
        <Button type="button" size="icon" variant="secondary" onClick={copyPublicUrl}>
          <Copy className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={link.id} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5">
            <div className="flex flex-col">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => handleMove(link.id, 'up')}
                className="text-muted-foreground disabled:opacity-20"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={i === links.length - 1}
                onClick={() => handleMove(link.id, 'down')}
                className="text-muted-foreground disabled:opacity-20"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{link.label}</p>
              <p className="truncate text-xs text-muted-foreground">{link.url}</p>
            </div>
            <button type="button" onClick={() => handleToggle(link)} className="text-muted-foreground">
              {link.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
            <button type="button" onClick={() => handleDelete(link.id)} className="text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <p className="rounded-xl bg-card px-4 py-6 text-center text-xs text-muted-foreground">
            Todavía no agregas enlaces.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-card/60 p-3.5">
        <Input placeholder="Nombre (ej. Mi portafolio)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button type="button" className="gap-1.5" disabled={adding} onClick={handleAdd}>
          <Plus className="size-4" /> Agregar enlace
        </Button>
      </div>
    </div>
  )
}
