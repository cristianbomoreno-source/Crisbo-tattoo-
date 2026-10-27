'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CaretRight, Plus, X } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Icon3D, type Icon3DName } from '@/components/ui/icon-3d'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cop, calculateBalance, nextSessionAt, formatSessionDate } from '@/lib/projects/metrics'
import { STATUS_LABELS } from '@/lib/projects/status'
import { getClientCrmAction, updateClientCrmAction, type ClientCrm } from '@/actions/crm'
import { LEAD_SOURCES, SUGGESTED_TAGS, leadSource, lostReason, visibleTags, cleanTags } from '@/lib/crm/options'

const QUOTE_STATUS: Record<string, string> = {
  new: 'Nueva',
  reviewed: 'Revisada',
  quoted: 'Cotizada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

/**
 * Ficha del cliente dentro del chat (CRM): lo que ha pagado, lo que debe, sus
 * proyectos y citas, cotizaciones, de dónde llegó, etiquetas y notas
 * internas. Se carga al abrir (getClientCrmAction) y guarda al instante.
 */
export function ClientCrmSheet({
  clientId,
  channel,
  open,
  onOpenChange,
}: {
  clientId: string
  channel: 'whatsapp' | 'instagram'
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [data, setData] = useState<ClientCrm | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [source, setSource] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [newTag, setNewTag] = useState('')
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    let alive = true
    getClientCrmAction(clientId).then((res) => {
      if (!alive) return
      if (!res.success) {
        toast.error(res.error.message)
        return
      }
      setData(res.data)
      setTags(res.data.client.tags)
      setSource(res.data.client.source)
      setNotes(res.data.client.notes ?? '')
    })
    return () => {
      alive = false
    }
  }, [open, clientId])

  function save(patch: { tags?: string[]; source?: string | null; notes?: string }, okMsg?: string) {
    startTransition(async () => {
      const res = await updateClientCrmAction(clientId, patch)
      if (!res.success) toast.error(res.error.message)
      else if (okMsg) toast.success(okMsg)
    })
  }

  function toggleTag(t: string) {
    const next = tags.some((x) => x.toLowerCase() === t.toLowerCase()) ? tags.filter((x) => x.toLowerCase() !== t.toLowerCase()) : cleanTags([...tags, t])
    setTags(next)
    save({ tags: next })
  }

  const c = data?.client
  const projects = data?.projects ?? []
  const paid = projects.reduce((s, p) => s + p.payments.reduce((a, x) => a + x.amount, 0), 0)
  const balance = projects.filter((p) => p.status !== 'completed').reduce((s, p) => s + Math.max(0, calculateBalance(p)), 0)
  const next = projects
    .map((p) => nextSessionAt(p))
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0]
  const shown = visibleTags(tags)
  const lost = lostReason(tags)
  const origin = leadSource(source, channel)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {!c ? (
          <div className="p-6">
            <DialogTitle>Ficha del cliente</DialogTitle>
            <p className="mt-2 text-muted-foreground">Cargando…</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center gap-4 px-5 pt-5 pb-4 pr-14">
              <span className="tile-gold grid size-16 shrink-0 place-items-center rounded-full text-[1.5rem] font-bold text-white">
                {c.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <DialogTitle className="truncate">{c.name}</DialogTitle>
                <DialogDescription className="truncate">
                  {[c.phone, c.instagram && `@${c.instagram.replace(/^@/, '')}`].filter(Boolean).join(' · ') || 'Sin contacto'}
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-6 px-5 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <Stat tone="tile-green" icon="coin" value={cop(paid)} label="Ha pagado" />
                <Stat tone="tile-teal" icon="money-bag" value={cop(balance)} label="Debe" />
                <Stat tone="tile-gold" icon="fountain-pen" value={String(projects.length)} label={projects.length === 1 ? 'Proyecto' : 'Proyectos'} />
                <Stat tone="tile-indigo" icon="spiral-calendar" value={next ? formatSessionDate(next) : '—'} label="Próxima cita" />
              </div>

              {lost && (
                <p className="rounded-[1.25rem] bg-destructive/12 px-4 py-3 text-[15px] font-semibold text-destructive">Se perdió por: {lost}</p>
              )}

              <Section title="Etiquetas">
                <div className="flex flex-wrap gap-2">
                  {shown.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[15px] font-semibold text-primary-foreground active:scale-95"
                    >
                      {t}
                      <X className="size-3.5" weight="bold" />
                    </button>
                  ))}
                  {SUGGESTED_TAGS.filter((t) => !shown.some((x) => x.toLowerCase() === t.toLowerCase())).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className="inline-flex h-9 items-center gap-1 rounded-full bg-foreground/[0.08] px-3.5 text-[15px] font-semibold text-muted-foreground active:scale-95"
                    >
                      <Plus className="size-3.5" weight="bold" />
                      {t}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!newTag.trim()) return
                    toggleTag(newTag)
                    setNewTag('')
                  }}
                  className="mt-2 flex gap-2"
                >
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Otra etiqueta"
                    maxLength={30}
                    className="h-11 min-w-0 flex-1 rounded-full bg-foreground/[0.08] px-4 text-[1.0625rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button type="submit" variant="secondary" className="h-11 px-4">
                    Agregar
                  </Button>
                </form>
              </Section>

              <Section title="De dónde llegó">
                <div className="flex flex-wrap gap-2">
                  {LEAD_SOURCES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSource(s)
                        save({ source: s })
                      }}
                      className={cn(
                        'h-9 rounded-full px-3.5 text-[15px] font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-95',
                        origin === s ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.08] text-foreground',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Notas">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ideas, alergias, cómo le gusta que le hablen…" />
                {notes !== (c.notes ?? '') && (
                  <Button
                    className="mt-2 h-11 w-full"
                    onClick={() => {
                      setData((d) => (d ? { ...d, client: { ...d.client, notes } } : d))
                      save({ notes }, 'Notas guardadas')
                    }}
                  >
                    Guardar notas
                  </Button>
                )}
              </Section>

              {projects.length > 0 && (
                <Section title="Proyectos">
                  <div className="space-y-2">
                    {projects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/dashboard/projects/${p.id}`}
                        className="flex items-center gap-3 rounded-[1.25rem] bg-foreground/[0.06] px-4 py-3 active:scale-[0.98]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[1.0625rem] font-semibold">{p.name}</span>
                          <span className="block truncate text-[13px] text-muted-foreground">
                            {STATUS_LABELS[p.status]} · {cop(p.total_value ?? 0)}
                          </span>
                        </span>
                        {calculateBalance(p) > 0 && p.status !== 'completed' && (
                          <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-[13px] font-semibold text-primary tabular-nums">
                            Debe {cop(calculateBalance(p))}
                          </span>
                        )}
                        <CaretRight className="size-4 shrink-0 text-muted-foreground" weight="bold" />
                      </Link>
                    ))}
                  </div>
                </Section>
              )}

              {(data?.quotes.length ?? 0) > 0 && (
                <Section title="Cotizaciones">
                  <div className="space-y-2">
                    {data!.quotes.map((q) => (
                      <Link
                        key={q.id}
                        href={`/dashboard/quotes/${q.id}`}
                        className="flex items-center gap-3 rounded-[1.25rem] bg-foreground/[0.06] px-4 py-3 active:scale-[0.98]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[1.0625rem] font-semibold">
                            {[q.style, q.body_zone].filter(Boolean).join(' · ') || 'Cotización'}
                          </span>
                          <span className="block text-[13px] text-muted-foreground">
                            {QUOTE_STATUS[q.status] ?? q.status} ·{' '}
                            {new Date(q.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </span>
                        </span>
                        {q.price ? <span className="shrink-0 text-[15px] font-semibold tabular-nums">{cop(q.price)}</span> : null}
                      </Link>
                    ))}
                  </div>
                </Section>
              )}

              <Link
                href={`/dashboard/clients/${c.id}`}
                className="flex h-12 items-center justify-center rounded-full bg-foreground/[0.08] text-[1.0625rem] font-semibold active:scale-[0.97]"
              >
                Abrir ficha completa
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-title text-[1.25rem] font-bold tracking-tight">{title}</h3>
      {children}
    </section>
  )
}

function Stat({ tone, icon, value, label }: { tone: string; icon: Icon3DName; value: string; label: string }) {
  return (
    <div className={cn('relative min-h-24 overflow-hidden rounded-[1.5rem] p-3.5 text-white', tone)}>
      <Icon3D name={icon} className="absolute top-2 right-2 size-10" />
      <p className="absolute right-3.5 bottom-3.5 left-3.5">
        <span className="block truncate font-title text-[1.25rem] leading-tight font-bold tabular-nums">{value}</span>
        <span className="block text-[12px] font-semibold text-white/75">{label}</span>
      </p>
    </div>
  )
}
