'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import { ArrowLeft, Briefcase, Check, Plus, Trash2, User, Wallet } from 'lucide-react'

import { createExpenseAction, deleteExpenseAction, payFixedExpenseAction, setFixedDiscountAction } from '@/actions/expenses'
import { AccountBookCard, Fab, LedgerView, NewRecordSheet, useSaveBalance } from '@/components/home/cash-ledger'
import { MOVE_IN_PREFIX, OTHER_INCOME_PREFIX, personalCategory } from '@/lib/expenses/scope'
import { todayKey } from '@/lib/calendar/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NO_ACCOUNT, WEEKDAYS, scheduleTag, type CashSummary, type FixedItem, type FixedSchedule } from '@/lib/finance/cash-summary'
import { cop } from '@/lib/projects/metrics'
import { cn } from '@/lib/utils'

export type Receivable = { total: number; count: number }

function shortDate(key: string) {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function whenLabel(f: FixedItem) {
  if (f.lastPaid) return 'Última cuota pagada'
  if (f.paidThisMonth) return `Pagado este mes · próximo ${shortDate(f.nextDate)}`
  if (!f.pending) return `Empieza el ${shortDate(f.nextDate)}`
  if (f.daysLeft < 0) return `Vencido hace ${-f.daysLeft} ${f.daysLeft === -1 ? 'día' : 'días'}`
  if (f.daysLeft === 0) return 'Vence hoy'
  if (f.daysLeft === 1) return 'Vence mañana'
  return `Vence ${shortDate(f.nextDate)} · en ${f.daysLeft} días`
}

/** Recuadro de la izquierda de un fijo: "día 5", "días 5·20", "cada dom". */
function badge(s: FixedSchedule): { top: string; main: string } {
  if (s.kind === 'weekly') return { top: 'cada', main: WEEKDAYS[s.weekday]!.slice(0, 3) }
  return s.days.length === 1 ? { top: 'día', main: String(s.days[0]) } : { top: 'días', main: s.days.join('·') }
}

/**
 * Resumen de caja de Inicio: se abre deslizando de derecha a izquierda en
 * el móvil (ver `HomeSwipe`). Saldo por cuenta, próximos pagos, gastos
 * fijos del negocio y personales con su fecha, y los gastos del mes.
 * Cálculo en `lib/finance/cash-summary.ts`.
 */
export function CashSummarySheet({
  open,
  onOpenChange,
  summary,
  receivable,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: CashSummary
  receivable: Receivable
}) {
  const { month } = summary
  // Métodos de pago del estudio + cuentas creadas escribiendo su saldo.
  const accounts = summary.accounts.map((a) => a.name).filter((n) => n !== NO_ACCOUNT)
  const monthOut = month.business + month.personal
  const shortfall = summary.upcomingTotal - summary.total
  // Cuentas que se muestran: las que tienen saldo inicial o movimientos.
  const shown = summary.accounts.filter((a) => a.setAt || a.income || a.expenses || a.transfersIn || a.transfersOut)
  const [view, setView] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const viewed = view ? (summary.accounts.find((a) => a.name === view) ?? null) : null

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setView(null)
          setAdding(false)
        }
        onOpenChange(o)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none" />
        <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-background pt-[env(safe-area-inset-top)] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-foreground outline-none duration-250 ease-out data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right motion-reduce:animate-none">
          {adding && <NewRecordSheet accounts={accounts} defaultAccount={viewed?.name ?? null} onClose={() => setAdding(false)} />}
          {viewed ? (
            <>
              <DialogPrimitive.Title className="sr-only">{viewed.name}</DialogPrimitive.Title>
              <LedgerView
                account={viewed}
                entries={summary.ledger.filter((e) => e.account === viewed.name)}
                accounts={accounts}
                onBack={() => setView(null)}
                onAdd={() => setAdding(true)}
              />
            </>
          ) : (
            <>
              <header className="sticky top-0 z-10 bg-muted/95 px-4 pb-4 pt-3 text-center backdrop-blur">
                <div className="flex items-center gap-2">
                  <DialogPrimitive.Close
                    aria-label="Volver a Inicio"
                    className="grid size-10 place-items-center rounded-full hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowLeft className="size-5" />
                  </DialogPrimitive.Close>
                  <DialogPrimitive.Title className="flex-1 font-display text-lg font-semibold">Resumen de caja</DialogPrimitive.Title>
                  <span className="size-10" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Saldo disponible</p>
                <p className={cn('font-display text-3xl font-bold tabular-nums', summary.total < 0 && 'text-destructive')}>
                  {cop(summary.total)}
                </p>
                {summary.total < 0 && (
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    Da negativo cuando a una cuenta le falta su saldo inicial. Toca la cuenta y ponle cuánto tiene.
                  </p>
                )}
              </header>

              <div className="space-y-6 px-4 pb-20 pt-4">
                {/* Este mes */}
                <section>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat label="Entró este mes" value={month.income} />
                    <Stat label="Negocio" value={month.business} negative />
                    <Stat label="Personal" value={month.personal} negative />
                  </div>
                  {monthOut > 0 && month.income > 0 && (
                    <p className="mt-2 px-1 text-xs text-muted-foreground">
                      Este mes te queda {cop(month.income - monthOut)} después de gastos.
                    </p>
                  )}
                </section>

                {/* Cuentas: tocar una abre su libro de movimientos */}
                <section>
                  <SectionTitle>Cuentas</SectionTitle>
                  <div className="space-y-2">
                    {shown.map((a) => (
                      <AccountBookCard key={a.name} account={a} onOpen={() => setView(a.name)} />
                    ))}
                    <NewAccountCard />
                  </div>
                </section>

                {/* Próximos pagos */}
                <section>
                  <SectionTitle>Próximos pagos</SectionTitle>
                  {summary.upcoming.length === 0 ? (
                    <Empty>Todo al día: no te queda nada por pagar este mes.</Empty>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {summary.upcoming.map((f) => (
                          <FixedRow key={f.id} item={f} accounts={accounts} showScope />
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Total por pagar</span>
                        <span className="font-semibold tabular-nums">{cop(summary.upcomingTotal)}</span>
                      </div>
                      {shortfall > 0 && (
                        <p className="mt-2 px-1 text-xs text-amber-500">
                          Te faltan {cop(shortfall)} para cubrir todo lo que falta pagar este mes.
                        </p>
                      )}
                    </>
                  )}
                </section>

                {/* Ingresos fijos: lo que te pagan cada mes (p. ej. el arriendo del tatuador) */}
                {summary.fixedIncome.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h2 className="text-sm font-semibold">Por recibir cada mes</h2>
                      {summary.incomingTotal > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums">Falta {cop(summary.incomingTotal)} este mes</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {summary.fixedIncome.map((f) => (
                        <FixedRow key={f.id} item={f} accounts={accounts} />
                      ))}
                    </div>
                  </section>
                )}

                {receivable.total > 0 && (
                  <section className="flex items-center justify-between rounded-2xl bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Por cobrar a clientes</p>
                      <p className="text-xs text-muted-foreground">
                        {receivable.count} {receivable.count === 1 ? 'proyecto con saldo' : 'proyectos con saldo'}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums text-primary">{cop(receivable.total)}</p>
                  </section>
                )}

                {/* Fijos: se guardan una vez y se repiten cada mes en su día */}
                <AddFixedForm accounts={accounts} />
                <FixedSection title="Gastos fijos del negocio" icon={Briefcase} items={summary.fixedBusiness} accounts={accounts} />
                <FixedSection title="Gastos fijos personales" icon={User} items={summary.fixedPersonal} accounts={accounts} />

                {/* Gastos del mes */}
                <section>
                  <SectionTitle>Gastos de este mes</SectionTitle>
                  {summary.monthExpenses.length === 0 ? (
                    <Empty>Todavía no hay gastos este mes.</Empty>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-2xl bg-card">
                      {summary.monthExpenses.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                            {e.personal ? <User className="size-4" /> : <Briefcase className="size-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{e.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {shortDate(e.date)}
                              {e.account && ` · ${e.account}`}
                              {e.note && ` · ${e.note}`}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold tabular-nums">−{cop(e.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </div>
              <Fab onClick={() => setAdding(true)} />
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Stat({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-2 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">
        {negative && value > 0 ? '−' : ''}
        {cop(value)}
      </p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 px-1 text-sm font-semibold">{children}</h2>
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-card px-4 py-5 text-center text-sm text-muted-foreground">{children}</p>
}

function FixedSection({
  title,
  icon: Icon,
  items,
  accounts,
}: {
  title: string
  icon: typeof Wallet
  items: FixedItem[]
  accounts: string[]
}) {
  const monthly = items.reduce((s, f) => s + f.perMonth, 0)
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </h2>
        {monthly > 0 && <span className="text-xs text-muted-foreground tabular-nums">{cop(monthly)} al mes</span>}
      </div>
      {items.length === 0 ? (
        <Empty>Sin gastos fijos todavía.</Empty>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <FixedRow key={f.id} item={f} accounts={accounts} />
          ))}
        </div>
      )}
    </section>
  )
}

function FixedRow({ item: f, accounts, showScope }: { item: FixedItem; accounts: string[]; showScope?: boolean }) {
  const router = useRouter()
  const [panel, setPanel] = useState<'pay' | 'discount' | 'delete' | null>(null)
  const [discountValue, setDiscountValue] = useState('')
  const [pending, startTransition] = useTransition()
  const urgent = f.pending && f.daysLeft <= 3
  const b = badge(f.schedule)
  const kind = f.income ? 'ingreso fijo' : 'gasto fijo'
  const toggle = (p: typeof panel) => setPanel((cur) => (cur === p ? null : p))

  function pay(account: string | null) {
    startTransition(async () => {
      const result = await payFixedExpenseAction(f.id, account)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      const paidId = result.data.id
      toast.success(`${f.name}: ${cop(f.dueAmount)} ${f.income ? 'recibido' : 'pagado'}${account ? ` · ${account}` : ''}`, {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            const undo = await deleteExpenseAction(paidId)
            if (!undo.success) toast.error(undo.error.message)
            router.refresh()
          },
        },
      })
      setPanel(null)
      router.refresh()
    })
  }

  function saveDiscount() {
    const amount = Number(discountValue.replace(/\D/g, '') || 0)
    startTransition(async () => {
      const result = await setFixedDiscountAction(f.id, amount)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success(amount ? `${f.name}: descuento de ${cop(amount)} este mes` : `${f.name}: sin descuento`)
      setPanel(null)
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteExpenseAction(f.id)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success(`${f.name} ya no se repite`)
      router.refresh()
    })
  }

  return (
    <div className={cn('rounded-2xl bg-card px-4 py-3', urgent && 'ring-1 ring-warning/50')}>
      <div className="flex items-center gap-3">
        <div className="w-12 shrink-0 text-center">
          <p className="text-[11px] uppercase text-muted-foreground">{b.top}</p>
          <p className={cn('font-display font-bold leading-none tabular-nums', b.main.length > 3 ? 'text-xs' : 'text-lg')}>{b.main}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {f.name}
            {f.installment && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                · cuota {f.installment.n} de {f.installment.total}
              </span>
            )}
            {showScope && <span className="ml-1.5 text-xs font-normal text-muted-foreground">· {f.personal ? 'Personal' : 'Negocio'}</span>}
          </p>
          <p className={cn('text-xs', f.paidThisMonth ? 'text-income' : urgent ? 'text-warning' : 'text-muted-foreground')}>
            {f.paidThisMonth && <Check className="mr-1 inline size-3" aria-hidden="true" />}
            {whenLabel(f)}
          </p>
          {f.remaining > 1 && (
            <p className="text-xs text-muted-foreground">
              Faltan {f.remaining} pagos este mes · {cop(f.amount * f.remaining - f.discount)}
            </p>
          )}
          {f.discount > 0 && f.pending && <p className="text-xs text-income">Descuento este mes −{cop(f.discount)}</p>}
        </div>
        <div className="shrink-0 text-right">
          {f.discount > 0 && f.pending ? (
            <>
              <p className="text-xs text-muted-foreground line-through tabular-nums">{cop(f.amount)}</p>
              <p className="text-sm font-semibold tabular-nums">{cop(f.dueAmount)}</p>
            </>
          ) : (
            <p className={cn('text-sm font-semibold tabular-nums', f.income && 'text-income')}>
              {f.income ? '+' : ''}
              {cop(f.amount)}
            </p>
          )}
          {f.schedule.kind === 'weekly' && <p className="text-[11px] text-muted-foreground">cada uno</p>}
        </div>
      </div>

      {/* Acciones en una fila: pagar y descuento a la izquierda; dejar de repetir lejos, a la derecha. */}
      {(f.pending || !showScope) && (
        <div className="mt-2.5 flex items-center gap-2">
          {f.pending && (
            <Button type="button" size="sm" variant={panel === 'pay' ? 'secondary' : 'default'} onClick={() => toggle('pay')}>
              {panel === 'pay' ? 'Cancelar' : f.income ? 'Marcar recibido' : 'Marcar pagado'}
            </Button>
          )}
          {f.pending && !f.income && panel !== 'pay' && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDiscountValue(f.discount ? String(f.discount) : '')
                toggle('discount')
              }}
            >
              {panel === 'discount' ? 'Cerrar' : 'Descuento'}
            </Button>
          )}
          {!showScope && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="ml-auto text-muted-foreground hover:text-destructive"
              aria-label={`Dejar de repetir ${f.name}`}
              onClick={() => toggle('delete')}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      )}

      {panel === 'discount' && (
        <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
          <Input
            autoFocus
            type="number"
            inputMode="numeric"
            placeholder="Descuento de este mes"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />
          <Button type="button" disabled={pending} onClick={saveDiscount}>
            Guardar
          </Button>
        </div>
      )}
      {panel === 'pay' && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {f.income ? `¿A qué cuenta llegaron los ${cop(f.dueAmount)}?` : `¿De qué cuenta salieron los ${cop(f.dueAmount)}?`}
          </p>
          <div className="flex flex-wrap gap-2">
            {[...(f.account ? [f.account] : []), ...accounts.filter((a) => a !== f.account), null].map((a) => (
              <button
                key={a ?? NO_ACCOUNT}
                type="button"
                disabled={pending}
                onClick={() => pay(a)}
                className="min-h-10 rounded-full border border-border px-3.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {a ?? NO_ACCOUNT}
              </button>
            ))}
          </div>
        </div>
      )}
      {panel === 'delete' && (
        <div className="mt-3 space-y-2.5 border-t border-border/60 pt-3">
          <p className="text-sm">
            ¿Dejar de repetir <span className="font-semibold">{f.name}</span>? Ya no aparecerá cada mes. Lo que ya{' '}
            {f.income ? 'recibiste' : 'pagaste'} se conserva.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setPanel(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" className="flex-1" disabled={pending} onClick={remove}>
              Eliminar {kind}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

type Frequency = 'once' | 'days' | 'weekly'

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'once', label: '1 vez al mes' },
  { value: 'days', label: 'Varios días' },
  { value: 'weekly', label: 'Cada semana' },
]

/** Alta de un gasto fijo: se guarda una vez (fila con `due_day`) y aparece
 * en cada fecha que le toca — un día al mes, varios días del mes o un día de
 * cada semana (la cadena de los domingos) — hasta marcarlo pagado. */
function AddFixedForm({ accounts }: { accounts: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<'business' | 'personal' | 'income'>('business')
  const personal = scope === 'personal'
  // Un ingreso fijo puede ser del negocio (cuenta en Finanzas) o plata que te pasan (familia, préstamos).
  const [isSale, setIsSale] = useState(true)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('once')
  const [day, setDay] = useState('')
  const [days, setDays] = useState('')
  const [weekday, setWeekday] = useState(0)
  const [account, setAccount] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function schedule(): FixedSchedule | string {
    if (frequency === 'weekly') return { kind: 'weekly', weekday }
    const raw = frequency === 'once' ? day : days
    const list = [...new Set(raw.split(/\D+/).filter(Boolean).map(Number))].sort((a, b) => a - b)
    if (!list.length || list.some((d) => d < 1 || d > 31)) return 'Los días deben estar entre 1 y 31'
    if (frequency === 'days' && list.length < 2) return 'Escribe al menos dos días (ej. 5, 20)'
    return {
      kind: 'monthly',
      days: frequency === 'once' ? list.slice(0, 1) : list,
    }
  }

  function save() {
    if (!name.trim()) return toast.error('Escribe qué es (ej. Arriendo)')
    if (!amount || Number(amount) <= 0) return toast.error('Ingresa el monto')
    const sch = schedule()
    if (typeof sch === 'string') return toast.error(sch)
    startTransition(async () => {
      const result = await createExpenseAction({
        category:
          scope === 'income'
            ? (isSale ? OTHER_INCOME_PREFIX : MOVE_IN_PREFIX) + name.trim()
            : personal
              ? personalCategory(name.trim())
              : name.trim(),
        description: [account, scheduleTag(sch)].filter(Boolean).join(' · ') || undefined,
        amount: Number(amount),
        expense_date: todayKey(),
        due_day: sch.kind === 'monthly' ? sch.days[0] : 1,
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      const when =
        sch.kind === 'weekly'
          ? `cada ${WEEKDAYS[sch.weekday]}`
          : sch.days.length === 1
            ? `el día ${sch.days[0]} de cada mes`
            : `los días ${sch.days.join(', ')} de cada mes`
      toast.success(`${name.trim()} guardado: se repite ${when}`)
      setName('')
      setAmount('')
      setDay('')
      setDays('')
      setAccount(null)
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" />
        Agregar gasto o ingreso fijo
      </button>
    )
  }

  return (
    <section className="space-y-2.5 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{scope === 'income' ? 'Nuevo ingreso fijo' : 'Nuevo gasto fijo'}</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-muted-foreground">
          Cancelar
        </button>
      </div>
      <Segmented
        options={[
          { value: 'business' as const, label: 'Negocio' },
          { value: 'personal' as const, label: 'Personal' },
          { value: 'income' as const, label: 'Me pagan' },
        ]}
        value={scope}
        onChange={setScope}
      />
      {scope === 'income' && (
        <Segmented
          small
          options={[
            { value: true, label: 'Ingreso del negocio' },
            { value: false, label: 'Me lo pasan (no es venta)' },
          ]}
          value={isSale}
          onChange={setIsSale}
        />
      )}
      <Input
        placeholder={
          scope === 'income'
            ? 'Qué es (ej. Arriendo tatuador)'
            : personal
              ? 'Qué es (ej. Cadena, Celular)'
              : 'Qué es (ej. Arriendo, Internet)'
        }
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={28}
      />
      <Input
        type="number"
        inputMode="numeric"
        placeholder={frequency === 'once' ? 'Monto (COP)' : 'Monto de cada pago (COP)'}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">¿Cada cuánto se paga?</p>
        <Segmented options={FREQUENCIES} value={frequency} onChange={setFrequency} small />
      </div>
      {frequency === 'once' && (
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Día del mes (1-31)"
          min={1}
          max={31}
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
      )}
      {frequency === 'days' && (
        <Input
          inputMode="numeric"
          placeholder="Días del mes separados por coma (ej. 5, 20)"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
      )}
      {frequency === 'weekly' && (
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => setWeekday(i)}
              aria-label={d}
              aria-pressed={weekday === i}
              className={cn(
                'rounded-full border py-2 text-xs font-semibold capitalize',
                weekday === i ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted',
              )}
            >
              {d.slice(0, 2)}
            </button>
          ))}
        </div>
      )}
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">
          {scope === 'income' ? '¿A qué cuenta te llega? (opcional)' : '¿De qué cuenta lo pagas? (opcional)'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {accounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAccount(account === a ? null : a)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium',
                account === a ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted',
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <Button type="button" onClick={save} disabled={pending} className="w-full">
        {frequency === 'weekly' ? `Guardar — se repite cada ${WEEKDAYS[weekday]}` : 'Guardar — se repite cada mes'}
      </Button>
    </section>
  )
}

function Segmented<T extends string | boolean>({
  options,
  value,
  onChange,
  small,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  small?: boolean
}) {
  return (
    <div
      className="grid gap-1 rounded-full bg-muted p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full py-2 font-semibold',
            small ? 'text-xs' : 'text-sm',
            value === o.value ? 'bg-background shadow-sm' : 'text-muted-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function NewAccountCard() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const { save, pending } = useSaveBalance(() => {
    setOpen(false)
    setName('')
    setValue('')
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:bg-muted/60"
      >
        <Plus className="size-4" />
        Nueva cuenta
      </button>
    )
  }

  return (
    <div className="col-span-2 space-y-2 rounded-2xl border border-primary/60 bg-card p-3">
      <p className="text-sm font-semibold">Nueva cuenta</p>
      <Input
        autoFocus
        placeholder="Nombre (ej. Bancolombia, Ahorros)"
        maxLength={30}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input type="number" inputMode="numeric" placeholder="¿Cuánto hay? (COP)" value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={pending}
          onClick={() => (name.trim() ? save(name, value) : toast.error('Escribe el nombre de la cuenta'))}
        >
          Crear
        </Button>
      </div>
    </div>
  )
}
