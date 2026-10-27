'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CaretLeft, MagnifyingGlass } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createPaymentAction } from '@/actions/payments'
import { ProjectCompletionStep } from '@/components/home/project-completion-step'
import { calculateBalance, cop } from '@/lib/projects/metrics'
import { PAYMENT_METHOD_OPTIONS } from '@/lib/validations/studio'
import type { ProjectSummary } from '@/queries/projects'
import type { SessionWithProject } from '@/queries/sessions'

type Step = { view: 'list' } | { view: 'detail'; projectId: string }

/**
 * Popup "Caja": reemplaza a "Registrar pagos del día" en Inicio. Dos
 * entradas — cobros con sesión hoy, o abono a cualquier otro proyecto
 * activo — y un detalle de cobro (valor, abonos previos, saldo, método de
 * pago) antes de registrar. Cada cobro queda en `payments` con
 * `payment_method`, y se resume en Finanzas → "Resumen de caja".
 */
export function CajaDialog({
  open,
  onOpenChange,
  projects,
  todaySessions,
  paymentMethods,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectSummary[]
  todaySessions: SessionWithProject[]
  paymentMethods?: string[] | null
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>({ view: 'list' })
  const [query, setQuery] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [asking, setAsking] = useState(false)

  const methods = paymentMethods?.length ? paymentMethods : [...PAYMENT_METHOD_OPTIONS]
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const todayProjectIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of todaySessions) {
      // Solo sesiones que YA se realizaron hoy -- antes entraba cualquier
      // sesión "no cancelada" (incluía 'scheduled'/'rescheduled'), así que
      // una cita agendada para más tarde ya aparecía como cobro pendiente
      // del día aunque el cliente ni hubiera llegado todavía.
      if (s.status === 'completed') ids.add(s.project_id)
    }
    return ids
  }, [todaySessions])

  const todayRows = projects.filter((p) => todayProjectIds.has(p.id) && calculateBalance(p) > 0)

  const q = query.trim().toLowerCase()
  const otherRows = projects.filter(
    (p) =>
      !todayProjectIds.has(p.id) &&
      p.status !== 'completed' &&
      calculateBalance(p) > 0 &&
      (q === '' ||
        p.name.toLowerCase().includes(q) ||
        (p.clients?.name ?? '').toLowerCase().includes(q))
  )

  function openDetail(project: ProjectSummary) {
    setAmount(String(Math.max(0, Math.round(calculateBalance(project)))))
    setMethod(methods[0] ?? '')
    setDone(false)
    setAsking(false)
    setStep({ view: 'detail', projectId: project.id })
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep({ view: 'list' })
      setQuery('')
    }
    onOpenChange(next)
  }

  async function submit(projectId: string) {
    const raw = amount.replace(/\D/g, '')
    const value = Number(raw)
    if (!value || value <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    setSaving(true)
    const result = await createPaymentAction({
      project_id: projectId,
      amount: value,
      payment_method: method || undefined,
    })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Cobro registrado')
    setDone(true)
    setAsking(true)
    router.refresh()
  }

  const detail = step.view === 'detail' ? projectById.get(step.projectId) : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 pr-14">
          {step.view === 'detail' && (
            <button
              type="button"
              onClick={() => setStep({ view: 'list' })}
              aria-label="Volver"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.08] transition-transform duration-150 ease-out active:scale-90"
            >
              <CaretLeft className="size-5" weight="bold" />
            </button>
          )}
          <DialogTitle className="text-[2.125rem] leading-[1.1] font-bold tracking-tight">{step.view === 'list' ? 'Caja' : 'Cobro'}</DialogTitle>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {step.view === 'list' && (
            <div className="space-y-6">
              <section className="space-y-2.5">
                <h3 className="font-title text-[1.25rem] font-bold tracking-tight">Por cobrar hoy</h3>
                {todayRows.length === 0 ? (
                  <p className="rounded-[1.25rem] bg-foreground/[0.06] px-4 py-3.5 text-[15px] text-muted-foreground">
                    No tienes cobros pendientes hoy.
                  </p>
                ) : (
                  todayRows.map((p) => <ProjectRow key={p.id} project={p} highlight onClick={() => openDetail(p)} />)
                )}
              </section>

              <section className="space-y-2.5">
                <h3 className="font-title text-[1.25rem] font-bold tracking-tight">Abono de otro proyecto</h3>
                <div className="relative">
                  <MagnifyingGlass
                    className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
                    weight="bold"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar cliente o proyecto"
                    className="h-12 w-full rounded-full bg-foreground/[0.08] pr-4 pl-11 text-[1.0625rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2.5">
                  {otherRows.length === 0 ? (
                    <p className="py-2 text-center text-[15px] text-muted-foreground">Sin resultados.</p>
                  ) : (
                    otherRows.map((p) => <ProjectRow key={p.id} project={p} onClick={() => openDetail(p)} />)
                  )}
                </div>
              </section>
            </div>
          )}

          {step.view === 'detail' && detail && (
            <div className="space-y-5">
              {/* Resumen como tarjeta de color (estilo "Logros" de Apple Games). */}
              <div className="tile-teal rounded-[1.75rem] p-5 text-white">
                <p className="truncate text-[1.25rem] leading-tight font-bold">{detail.clients?.name ?? '—'}</p>
                <p className="truncate text-[15px] text-white/70">{detail.name}</p>
                <p className="mt-4 text-[13px] font-semibold tracking-wide text-white/70 uppercase">Saldo pendiente</p>
                <p className="font-title text-[2.25rem] leading-none font-bold tabular-nums">{cop(calculateBalance(detail))}</p>
                <p className="mt-1.5 text-[15px] text-white/70">
                  de {cop(detail.total_value ?? 0)}
                </p>
              </div>

              {detail.payments.length > 0 && (
                <section className="space-y-2">
                  <h3 className="font-title text-[1.125rem] font-bold tracking-tight">Abonos</h3>
                  <ul className="divide-y divide-border overflow-hidden rounded-[1.25rem] bg-foreground/[0.06]">
                    {[...detail.payments]
                      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())
                      .map((pay) => (
                        <li key={pay.id} className="flex items-center justify-between px-4 py-3 text-[15px]">
                          <span className="text-muted-foreground">
                            {new Date(pay.paid_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                            {pay.payment_method ? ` · ${pay.payment_method}` : ''}
                          </span>
                          <span className="font-semibold tabular-nums">{cop(pay.amount)}</span>
                        </li>
                      ))}
                  </ul>
                </section>
              )}

              {done && asking ? (
                <ProjectCompletionStep projectId={detail.id} onDone={() => setAsking(false)} />
              ) : done ? (
                <p className="text-center text-[1.0625rem] font-semibold text-income">Cobro registrado ✓</p>
              ) : calculateBalance(detail) <= 0 ? (
                <p className="text-center text-[15px] text-muted-foreground">Sin saldo pendiente.</p>
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Monto recibido
                    </span>
                    <input
                      inputMode="numeric"
                      value={amount ? cop(Number(amount.replace(/\D/g, '')) || 0) : ''}
                      onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                      placeholder="$0"
                      className="h-16 w-full rounded-[1.25rem] bg-foreground/[0.08] px-4 text-center font-title !text-[2rem] font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>

                  <div>
                    <span className="mb-1.5 block text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Cuenta</span>
                    <div className="flex flex-wrap gap-2">
                      {methods.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMethod(m)}
                          className={cn(
                            'rounded-full px-4 py-2 text-[15px] font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-95',
                            method === m ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.08] text-foreground',
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button type="button" onClick={() => submit(detail.id)} disabled={saving} className="h-14 w-full text-[1.0625rem]">
                    {saving ? 'Guardando…' : 'Registrar cobro'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Fila de proyecto como la lista de Apple Games: cuadro de color con la
 * inicial del cliente, nombre en negrita, proyecto en gris y el saldo en
 * una píldora a la derecha. */
function ProjectRow({ project, highlight, onClick }: { project: ProjectSummary; highlight?: boolean; onClick: () => void }) {
  const name = project.clients?.name ?? '—'
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 text-left transition-transform duration-150 ease-out active:scale-[0.98]"
    >
      <span
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-[0.9rem] text-[1.25rem] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]',
          highlight ? 'tile-gold' : 'tile-gray',
        )}
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[1.0625rem] font-semibold">{name}</span>
        <span className="block truncate text-[15px] text-muted-foreground">{project.name}</span>
      </span>
      <span
        className={cn(
          'shrink-0 rounded-full px-3.5 py-1.5 text-[15px] font-semibold tabular-nums',
          highlight ? 'bg-primary/15 text-primary' : 'bg-foreground/[0.08]',
        )}
      >
        {cop(calculateBalance(project))}
      </span>
    </button>
  )
}
