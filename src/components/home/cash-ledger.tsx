'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import { ArrowLeft, ArrowLeftRight, Delete, Landmark, Pencil, Plus, X } from 'lucide-react'

import { createExpenseAction, deleteExpenseAction, reclassifyExpenseAction, setAccountBalanceAction } from '@/actions/expenses'
import { deletePaymentAction } from '@/actions/payments'
import { MOVE_IN_PREFIX, MOVE_OUT_PREFIX, OTHER_INCOME_PREFIX, TRANSFER_PREFIX, personalCategory } from '@/lib/expenses/scope'
import { todayKey } from '@/lib/calendar/utils'
import { NO_ACCOUNT, type AccountBalance, type LedgerEntry } from '@/lib/finance/cash-summary'
import { cop } from '@/lib/projects/metrics'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Libro de cada cuenta del Resumen de caja (estilo app de cuentas): tarjeta
 * con saldo inicial, ingresos, gastos, transferencias y saldo; lista de
 * movimientos por día con su tipo; y "+" para anotar un ingreso, un gasto o
 * un traslado entre cuentas con una calculadora. Todo se guarda en
 * `expenses` con las convenciones de `lib/finance/cash-summary.ts`.
 */

const KIND_STYLE = {
  income: {
    bar: 'bg-income',
    pill: 'bg-income text-income-foreground',
    sign: '+',
  },
  expense: { bar: 'bg-red-500', pill: 'bg-red-500 text-white', sign: '−' },
  'transfer-out': {
    bar: 'bg-transfer',
    pill: 'bg-transfer text-transfer-foreground',
    sign: '−',
  },
  'transfer-in': {
    bar: 'bg-transfer',
    pill: 'bg-transfer text-transfer-foreground',
    sign: '+',
  },
} as const

function longDate(key: string, today: string) {
  if (key === today) return 'Hoy'
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  const yesterday = new Date(Date.parse(`${today}T12:00:00Z`) - 86400000).toISOString().slice(0, 10)
  if (key === yesterday) return 'Ayer'
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Bogota',
  })
}

/** Tarjeta de una cuenta en el Resumen de caja (tocarla abre su libro). */
export function AccountBookCard({ account: a, onOpen }: { account: AccountBalance; onOpen: () => void }) {
  const transfers = a.transfersIn - a.transfersOut
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl bg-card p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-foreground/80">
          <Landmark className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base font-semibold">{a.name}</span>
          <span className="block text-xs text-muted-foreground">
            {a.setAt ? `Saldo inicial del ${shortDate(a.setAt)}` : a.name === NO_ACCOUNT ? 'Registrado sin cuenta' : 'Sin saldo inicial'}
          </span>
        </span>
      </span>
      <span className="mt-3 grid gap-1 text-sm tabular-nums">
        <Line label="Saldo inicial" value={cop(a.setAmount ?? 0)} />
        <Line label="Ingresos" value={cop(a.income)} className="pl-3 text-income" />
        <Line label="Gastos" value={cop(a.expenses)} className="pl-3 text-red-500" />
        {(a.transfersIn > 0 || a.transfersOut > 0) && (
          <Line label="Transferencias" value={`${transfers >= 0 ? '+' : '−'} ${cop(Math.abs(transfers))}`} className="pl-3 text-transfer" />
        )}
        <Line
          label="Saldo"
          value={cop(a.balance)}
          className={cn('mt-1 border-t border-border/60 pt-1.5 text-base font-bold', a.balance < 0 && 'text-destructive')}
        />
      </span>
    </button>
  )
}

function Line({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span className={cn('flex items-baseline justify-between gap-3', className)}>
      <span>{label}</span>
      <span>{value}</span>
    </span>
  )
}

/** Libro de una cuenta: movimientos por día, totales y ajuste del saldo. */
export function LedgerView({
  account,
  entries,
  accounts,
  onBack,
  onAdd,
}: {
  account: AccountBalance
  entries: LedgerEntry[]
  accounts: string[]
  onBack: () => void
  onAdd: () => void
}) {
  const today = todayKey()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const { save, pending } = useSaveBalance(() => setEditing(false))
  const days = useMemo(() => {
    const map = new Map<string, LedgerEntry[]>()
    for (const e of entries) map.set(e.date, [...(map.get(e.date) ?? []), e])
    return [...map.entries()]
  }, [entries])
  const totalIn = entries.filter((e) => e.kind === 'income' || e.kind === 'transfer-in').reduce((s, e) => s + e.amount, 0)
  const totalOut = entries.filter((e) => e.kind === 'expense' || e.kind === 'transfer-out').reduce((s, e) => s + e.amount, 0)
  const isNoAccount = account.name === NO_ACCOUNT

  return (
    <div>
      <header className="sticky top-0 z-10 bg-muted/95 px-4 pb-4 pt-3 text-center backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver al resumen"
            className="grid size-10 place-items-center rounded-full hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-5" />
          </button>
          <p className="flex-1 truncate font-display text-lg font-semibold">{account.name}</p>
          {!isNoAccount ? (
            <button
              type="button"
              onClick={() => {
                setValue('')
                setEditing((v) => !v)
              }}
              aria-label="Ajustar saldo"
              className="grid size-10 place-items-center rounded-full hover:bg-background/60"
            >
              <Pencil className="size-4" />
            </button>
          ) : (
            <span className="size-10" />
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Saldo disponible</p>
        <p className={cn('font-display text-3xl font-bold tabular-nums', account.balance < 0 && 'text-destructive')}>
          {cop(account.balance)}
        </p>
        {account.balance < 0 && !editing && (
          <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
            {account.setAt
              ? 'Salió más de lo que había. Revisa si falta anotar una entrada o corrige el saldo con el lápiz.'
              : 'Falta el saldo inicial de esta cuenta: tócale el lápiz y escribe cuánto tiene.'}
          </p>
        )}
        {editing && (
          <div className="mx-auto mt-3 max-w-xs space-y-2 text-left">
            <p className="text-xs text-muted-foreground">
              ¿Cuánto hay ahora en {account.name}? Desde este momento el libro empieza con ese saldo.
            </p>
            <Input
              autoFocus
              type="number"
              inputMode="numeric"
              placeholder={String(Math.max(0, Math.round(account.balance)))}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button type="button" className="w-full" disabled={pending} onClick={() => save(account.name, value)}>
              Guardar saldo
            </Button>
          </div>
        )}
      </header>

      {days.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Sin movimientos desde el saldo inicial. Toca + para anotar uno.
        </p>
      ) : (
        days.map(([day, list]) => (
          <section key={day}>
            <h3 className="bg-muted/50 px-4 py-2 text-sm font-semibold capitalize">{longDate(day, today)}</h3>
            <div className="divide-y divide-border/60 bg-card">
              {list.map((e) => (
                <LedgerRow key={e.key} entry={e} accounts={accounts} />
              ))}
            </div>
          </section>
        ))
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/40 px-4 py-3 text-sm font-semibold tabular-nums">
        <span className="text-muted-foreground">Total</span>
        <span className="rounded-full bg-income px-3 py-1 text-income-foreground">+ {cop(totalIn)}</span>
        <span className="rounded-full bg-red-500 px-3 py-1 text-white">− {cop(totalOut)}</span>
      </div>
      {account.setAt && (
        <div className="flex items-center justify-between px-4 py-3 text-sm tabular-nums">
          <span className="text-muted-foreground">Saldo inicial · {shortDate(account.setAt)}</span>
          <span className="font-semibold">{cop(account.setAmount ?? 0)}</span>
        </div>
      )}

      <Fab onClick={onAdd} />
    </div>
  )
}

/** Botón "+" pegado abajo a la derecha del panel (sticky: el panel es el que hace scroll). */
export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <div className="pointer-events-none sticky bottom-0 z-20 -mt-14 flex justify-end px-5 pb-5">
      <button
        type="button"
        onClick={onClick}
        aria-label="Nuevo movimiento"
        className="pointer-events-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="size-6" />
      </button>
    </div>
  )
}

/** Un movimiento. Tocarlo deja cambiar qué fue o borrarlo. Los cobros a clientes
 * solo se pueden borrar (reversar el ingreso): salen de la caja, del proyecto y de Estadísticas. */
function LedgerRow({ entry: e, accounts }: { entry: LedgerEntry; accounts: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()
  const style = KIND_STYLE[e.kind]
  const editable = !!e.expenseId || !!e.paymentId
  const isPayment = !e.expenseId && !!e.paymentId
  const others = accounts.filter((a) => a !== e.account)

  function run(fn: () => Promise<{ success: boolean; error?: { message: string } }>, done: string) {
    startTransition(async () => {
      const result = await fn()
      if (!result.success) {
        toast.error(result.error?.message ?? 'No se pudo guardar')
        return
      }
      toast.success(done)
      setOpen(false)
      router.refresh()
    })
  }
  const reclassify = (category: string, description?: string | null) =>
    run(() => reclassifyExpenseAction(e.expenseId!, category, description), `${e.name}: listo`)
  const withAccount = (acc: string) => [acc, e.note ?? (e.kind.startsWith('transfer') ? null : e.name)].filter(Boolean).join(' · ')

  const isOut = e.kind === 'expense' || e.kind === 'transfer-out'
  const options: { label: string; active: boolean; onClick: () => void }[] = isOut
    ? [
        {
          label: 'Gasto personal',
          active: e.tipo === 'Personal',
          onClick: () => reclassify(personalCategory(e.name), e.kind === 'transfer-out' ? withAccount(e.account) : undefined),
        },
        {
          label: 'Gasto del negocio',
          active: e.tipo === 'Negocio',
          onClick: () => reclassify(e.name, e.kind === 'transfer-out' ? withAccount(e.account) : undefined),
        },
        {
          label: 'Sin clasificar',
          active: e.tipo === 'Sin clasificar',
          onClick: () => reclassify(MOVE_OUT_PREFIX + e.name, e.kind === 'transfer-out' ? withAccount(e.account) : undefined),
        },
      ]
    : e.kind === 'income'
      ? [
          {
            label: 'Venta suelta',
            active: e.tipo === 'Ingreso',
            onClick: () => reclassify(OTHER_INCOME_PREFIX + e.name),
          },
          {
            label: 'No es venta',
            active: e.tipo === 'Entrada',
            onClick: () => reclassify(MOVE_IN_PREFIX + e.name),
          },
        ]
      : [
          {
            label: 'No es transferencia',
            active: false,
            onClick: () => reclassify(MOVE_IN_PREFIX + e.name, [e.account, e.name].join(' · ')),
          },
        ]

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!editable}
        onClick={() => {
          setOpen((v) => !v)
          setConfirmDelete(false)
        }}
        className="flex w-full items-stretch gap-3 px-4 py-3 text-left enabled:hover:bg-muted/40"
      >
        <span className={cn('w-1 shrink-0 rounded-full', style.bar)} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0 truncate font-medium">{e.name}</span>
            <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums', style.pill)}>
              {style.sign} {cop(e.amount)}
            </span>
          </span>
          <span className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground">
            <span>Tipo</span>
            <span className="truncate text-foreground/80">{e.tipo}</span>
          </span>
          <span className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span>{e.kind === 'transfer-out' ? 'Destino' : e.kind === 'transfer-in' ? 'Origen' : 'Nota'}</span>
            <span className="truncate text-foreground/80">{e.otherAccount ?? e.note ?? '—'}</span>
          </span>
        </span>
      </button>

      {open && isPayment && (
        <div className="space-y-2.5 border-t border-border/60 bg-muted/30 px-4 py-3">
          <p className="text-[15px] text-muted-foreground">
            Es un cobro de un cliente. Si lo reversas, se quita de esta cuenta, del saldo pagado de su proyecto y de lo que entró en Estadísticas.
          </p>
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-11 flex-1 rounded-full bg-secondary text-[15px] font-semibold"
              >
                No
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deletePaymentAction({ payment_id: e.paymentId! }), `Cobro reversado: ${cop(e.amount)}`)}
                className="h-11 flex-1 rounded-full bg-destructive text-[15px] font-semibold text-white disabled:opacity-50"
              >
                {pending ? 'Reversando…' : `Sí, reversar ${cop(e.amount)}`}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="h-11 w-full rounded-full bg-destructive/15 text-[15px] font-semibold text-destructive"
            >
              Reversar este cobro
            </button>
          )}
        </div>
      )}

      {open && editable && !isPayment && (
        <div className="space-y-2.5 border-t border-border/60 bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">¿Qué fue?</p>
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => (
              <Chip key={o.label} active={o.active} disabled={pending} onClick={o.onClick}>
                {o.label}
              </Chip>
            ))}
          </div>
          {e.kind !== 'transfer-in' && e.kind !== 'transfer-out' && others.length > 0 && (
            <>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeftRight className="size-3" />
                {isOut ? 'Lo pasé a otra cuenta mía' : 'Vino de otra cuenta mía'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {others.map((a) =>
                  isOut ? (
                    <Chip key={a} disabled={pending} onClick={() => reclassify(TRANSFER_PREFIX + a, [e.account, e.name].join(' · '))}>
                      {a}
                    </Chip>
                  ) : (
                    <Chip key={a} disabled={pending} onClick={() => reclassify(TRANSFER_PREFIX + e.account, [a, e.name].join(' · '))}>
                      {a}
                    </Chip>
                  ),
                )}
              </div>
            </>
          )}
          <div className="flex justify-end">
            {confirmDelete ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">¿Borrarlo?</span>
                <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold text-muted-foreground">
                  No
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteExpenseAction(e.expenseId!), 'Movimiento borrado')}
                  className="font-semibold text-destructive"
                >
                  Sí, borrar
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs font-semibold text-destructive">
                Borrar movimiento
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-10 rounded-full border px-3.5 text-sm font-medium disabled:opacity-50',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

export function useSaveBalance(onDone: () => void) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  function save(account: string, raw: string) {
    const amount = Number(raw.replace(/\D/g, ''))
    if (!raw.trim()) return toast.error('Escribe cuánto hay')
    startTransition(async () => {
      const result = await setAccountBalanceAction(account, amount)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success(`${account.trim()}: ${cop(amount)}`)
      onDone()
      router.refresh()
    })
  }
  return { save, pending }
}

// ── Nuevo movimiento ────────────────────────────────────────────────────────

type RecordKind = 'income' | 'transfer' | 'expense'

/** Evalúa lo que se escribió en la calculadora ("120000+35000×2"). null si está incompleto. */
export function evaluate(expr: string): number | null {
  const tokens = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .match(/\d+(?:\.\d+)?|[+\-*/]/g)
  if (!tokens?.length) return null
  // Primero × y ÷, después + y −.
  const terms: (number | string)[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!
    if (t === '*' || t === '/') {
      const prev = terms.pop()
      const next = Number(tokens[++i])
      if (typeof prev !== 'number' || Number.isNaN(next)) return null
      if (t === '/' && next === 0) return null
      terms.push(t === '*' ? prev * next : prev / next)
    } else terms.push(/\d/.test(t) ? Number(t) : t)
  }
  let total = typeof terms[0] === 'number' ? terms[0] : null
  if (total === null) return null
  for (let i = 1; i < terms.length; i += 2) {
    const op = terms[i]
    const n = terms[i + 1]
    if (typeof n !== 'number') return null
    total = op === '+' ? total + n : total - n
  }
  return total
}

export function NewRecordSheet({
  accounts,
  defaultAccount,
  onClose,
}: {
  accounts: string[]
  defaultAccount: string | null
  onClose: () => void
}) {
  const router = useRouter()
  const [kind, setKind] = useState<RecordKind>('expense')
  const [date, setDate] = useState(todayKey())
  const [name, setName] = useState('')
  const [account, setAccount] = useState<string | null>(defaultAccount ?? accounts[0] ?? null)
  const [to, setTo] = useState<string | null>(null)
  const [scope, setScope] = useState<'personal' | 'business' | 'none'>('personal')
  const [isSale, setIsSale] = useState(false)
  const [expr, setExpr] = useState('')
  const [pending, startTransition] = useTransition()
  const result = evaluate(expr)

  function press(k: string) {
    if (k === 'C') return setExpr('')
    if (k === '⌫') return setExpr((v) => v.slice(0, -1))
    if (k === '=') return setExpr(result !== null ? String(Math.round(result)) : expr)
    setExpr((v) => {
      const last = v.slice(-1)
      if ('+−×÷'.includes(k)) return v === '' ? v : '+−×÷'.includes(last) ? v.slice(0, -1) + k : v + k
      return v + k
    })
  }

  function insert() {
    const amount = result !== null ? Math.round(result) : 0
    if (amount <= 0) return toast.error('Escribe el monto en la calculadora')
    if (!account) return toast.error('Elige la cuenta')
    const label = name.trim()
    let category: string
    let description: string
    if (kind === 'transfer') {
      if (!to || to === account) return toast.error('Elige a qué cuenta pasó la plata')
      category = TRANSFER_PREFIX + to
      description = [account, label].filter(Boolean).join(' · ')
    } else if (kind === 'income') {
      category = (isSale ? OTHER_INCOME_PREFIX : MOVE_IN_PREFIX) + (label || (isSale ? 'Venta' : 'Entrada'))
      description = account
    } else {
      const base = label || 'Gasto'
      category = scope === 'personal' ? personalCategory(base) : scope === 'business' ? base : MOVE_OUT_PREFIX + base
      description = account
    }
    startTransition(async () => {
      const res = await createExpenseAction({
        category: category.slice(0, 40),
        description,
        amount,
        expense_date: date,
      })
      if (!res.success) {
        toast.error(res.error.message)
        return
      }
      toast.success(
        kind === 'transfer' ? `Pasaste ${cop(amount)} a ${to}` : kind === 'income' ? `Entró ${cop(amount)}` : `Salió ${cop(amount)}`,
      )
      router.refresh()
      onClose()
    })
  }

  const keys = ['C', '⌫', '÷', '×', '7', '8', '9', '−', '4', '5', '6', '+', '1', '2', '3', '=', '000', '0']

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-foreground outline-none">
          <header className="flex items-center gap-2 px-4 py-3">
            <DialogPrimitive.Close aria-label="Cerrar" className="grid size-10 place-items-center rounded-full bg-secondary transition-transform duration-150 ease-out active:scale-90">
              <X className="size-5" />
            </DialogPrimitive.Close>
            <DialogPrimitive.Title className="text-[1.625rem] leading-tight font-bold tracking-tight">Nuevo movimiento</DialogPrimitive.Title>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4">
            <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
              {(
                [
                  ['income', 'Ingreso', 'bg-income text-income-foreground'],
                  ['transfer', 'Transferencia', 'bg-transfer text-transfer-foreground'],
                  ['expense', 'Egreso', 'bg-red-500 text-white'],
                ] as const
              ).map(([k, label, on]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    'rounded-full py-2 text-xs font-semibold uppercase tracking-wide',
                    kind === k ? on : 'text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <Input placeholder="Nombre (opcional)" value={name} maxLength={28} onChange={(e) => setName(e.target.value)} />
              <Input
                type="date"
                value={date}
                max={todayKey()}
                onChange={(e) => setDate(e.target.value || todayKey())}
                className="w-[9.5rem]"
              />
            </div>

            <ChipRow
              label={kind === 'transfer' ? 'Desde' : kind === 'income' ? 'Entró a' : 'Salió de'}
              options={accounts}
              value={account}
              onChange={setAccount}
            />
            {kind === 'transfer' && <ChipRow label="Hacia" options={accounts.filter((a) => a !== account)} value={to} onChange={setTo} />}
            {kind === 'expense' && (
              <ChipRow
                label="Tipo"
                options={['Personal', 'Negocio', 'No es gasto']}
                value={scope === 'personal' ? 'Personal' : scope === 'business' ? 'Negocio' : 'No es gasto'}
                onChange={(v) => setScope(v === 'Personal' ? 'personal' : v === 'Negocio' ? 'business' : 'none')}
              />
            )}
            {kind === 'income' && (
              <ChipRow
                label="Tipo"
                options={['No es venta', 'Venta suelta']}
                value={isSale ? 'Venta suelta' : 'No es venta'}
                onChange={(v) => setIsSale(v === 'Venta suelta')}
              />
            )}
            {kind === 'income' && (
              <p className="text-xs text-muted-foreground">Los cobros de clientes se registran en su proyecto, con Caja.</p>
            )}
          </div>

          <div className="border-t border-border bg-card">
            <div className="px-4 pb-2 pt-3 text-right">
              <p className="min-h-5 truncate text-sm text-muted-foreground tabular-nums">
                {expr && result !== null && /[+−×÷]/.test(expr) ? expr : ''}
              </p>
              <p className="truncate font-display text-4xl font-bold tabular-nums">{cop(result !== null ? Math.round(result) : 0)}</p>
            </div>
            <div className="grid grid-cols-4 gap-px bg-border">
              {keys.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => press(k)}
                  aria-label={k === '⌫' ? 'Borrar' : k}
                  className={cn(
                    'h-14 bg-background text-xl font-medium active:bg-muted',
                    /[C⌫÷×−+=]/.test(k) && 'bg-muted/70',
                    (k === '000' || k === '0') && 'col-span-2',
                  )}
                >
                  {k === '⌫' ? <Delete className="mx-auto size-5" /> : k}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={insert}
              className="h-14 w-full bg-primary text-base font-semibold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
            >
              Insertar
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  )
}
