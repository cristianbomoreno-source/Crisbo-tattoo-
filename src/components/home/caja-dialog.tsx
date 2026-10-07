'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Wallet, Search, ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step.view === 'detail' && (
              <button
                type="button"
                onClick={() => setStep({ view: 'list' })}
                aria-label="Volver"
                className="-ml-1 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <ChevronLeft className="size-4" strokeWidth={2} />
              </button>
            )}
            <Wallet className="size-4 text-primary" strokeWidth={2} />
            {step.view === 'list' ? 'Caja' : 'Cobro'}
          </DialogTitle>
        </DialogHeader>

        {step.view === 'list' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cobros pendientes del día
              </p>
              {todayRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tienes cobros pendientes hoy.</p>
              ) : (
                <div className="space-y-2">
                  {todayRows.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openDetail(p)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-background p-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.clients?.name ?? '—'}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.name}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                        {cop(calculateBalance(p))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Abono de otro proyecto
              </p>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.7}
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar proyecto o cliente…"
                  className="pl-8"
                />
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {otherRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin resultados.</p>
                ) : (
                  otherRows.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openDetail(p)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-background p-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.clients?.name ?? '—'}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.name}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                        {cop(calculateBalance(p))}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {step.view === 'detail' && detail && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-background p-4">
              <p className="text-sm font-semibold">{detail.clients?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{detail.name}</p>

              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor del proyecto</span>
                  <span className="font-semibold tabular-nums">{cop(detail.total_value ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Saldo pendiente</span>
                  <span className="font-semibold tabular-nums text-primary">
                    {cop(calculateBalance(detail))}
                  </span>
                </div>
              </div>
            </div>

            {detail.payments.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Abonos realizados
                </p>
                <ul className="space-y-1.5">
                  {[...detail.payments]
                    .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())
                    .map((pay) => (
                      <li
                        key={pay.id}
                        className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {new Date(pay.paid_at).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          {pay.payment_method ? ` · ${pay.payment_method}` : ''}
                        </span>
                        <span className="font-semibold tabular-nums">{cop(pay.amount)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {done && asking ? (
              <ProjectCompletionStep projectId={detail.id} onDone={() => setAsking(false)} />
            ) : done ? (
              <p className="text-sm font-medium text-primary">Cobro registrado ✓</p>
            ) : calculateBalance(detail) <= 0 ? (
              <p className="text-sm text-muted-foreground">Sin saldo pendiente.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Monto recibido</label>
                  <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground">Método de pago</label>
                  <div className="flex flex-wrap gap-1.5">
                    {methods.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          method === m
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => submit(detail.id)}
                  disabled={saving}
                  className="h-11 w-full"
                >
                  {saving ? 'Guardando…' : 'Registrar cobro'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
