'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Receipt, Trash2, Plus, CalendarClock } from 'lucide-react'

import { createExpenseAction, deleteExpenseAction } from '@/actions/expenses'
import type { Expense } from '@/queries/expenses'
import { SettingsSubpage } from '@/components/settings/settings-subpage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cop } from '@/lib/projects/metrics'
import { todayKey } from '@/lib/calendar/utils'
import { isOtherIncome, personalCategory } from '@/lib/expenses/scope'
import { cn } from '@/lib/utils'

function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Panel de gastos/costos del estudio — categorías 100% libres (el
 * tatuador escribe la que quiera, sin lista fija para elegir). Mismo
 * patrón de UI que `fechas-panel.tsx`: lista + formulario de alta simple. */
export function GastosPanel({ expenses, accounts }: { expenses: Expense[]; accounts: string[] }) {
  const router = useRouter()
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayKey())
  const [dueDay, setDueDay] = useState('')
  const [personal, setPersonal] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Los "Ingreso · …" del atajo se listan para poder borrarlos, pero no son gasto.
  const total = expenses.filter((e) => !isOtherIncome(e.category) && e.due_day === null).reduce((sum, e) => sum + e.amount, 0)

  function add() {
    if (!category.trim()) {
      toast.error('Escribe una categoría')
      return
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    const dueDayNum = dueDay ? Number(dueDay) : null
    if (dueDayNum !== null && (dueDayNum < 1 || dueDayNum > 31)) {
      toast.error('El día debe estar entre 1 y 31')
      return
    }
    startTransition(async () => {
      const result = await createExpenseAction({
        category: personal ? personalCategory(category.trim()) : category.trim(),
        // Misma convención que los atajos del iPhone: la cuenta va primero en
        // la descripción ("Nequi · nota") — así la lee el Resumen de caja.
        description: [account, description.trim()].filter(Boolean).join(' · ') || undefined,
        amount: Number(amount),
        expense_date: date,
        due_day: dueDayNum,
      })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Gasto registrado')
      setCategory('')
      setDescription('')
      setAmount('')
      setDueDay('')
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteExpenseAction(id)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Gasto eliminado')
      router.refresh()
    })
  }

  return (
    <SettingsSubpage
      title="Gastos y costos"
      description="Registra tus gastos con la categoría que quieras — sin lista fija."
    >
      <div className="space-y-5">
        <div className="rounded-2xl bg-card p-4">
          <p className="text-xs text-muted-foreground">Total registrado</p>
          <p className="mt-1 font-title font-bold text-2xl tabular-nums">{cop(total)}</p>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-border p-4">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
            {[false, true].map((p) => (
              <button
                key={String(p)}
                type="button"
                onClick={() => setPersonal(p)}
                className={cn('rounded-full py-2 text-sm font-semibold', personal === p ? 'bg-background shadow-sm' : 'text-muted-foreground')}
              >
                {p ? 'Personal' : 'Negocio'}
              </button>
            ))}
          </div>
          <Input placeholder="Categoría (ej. Arriendo, Insumos, Publicidad...)" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={40} />
          <Input placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
          <div className="grid grid-cols-2 gap-2.5">
            <Input type="number" inputMode="numeric" placeholder="Monto (COP)" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2.5">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Día vencimiento (1-31)"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              min={1}
              max={31}
              className="flex-1"
            />
            <p className="text-xs text-muted-foreground">Opcional: si es gasto fijo mensual</p>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">¿De qué cuenta sale? (opcional)</p>
            <div className="flex flex-wrap gap-1.5">
              {accounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccount(account === a ? null : a)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium',
                    account === a ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <Button type="button" onClick={add} disabled={pending} className="w-full gap-1.5">
            <Plus className="size-4" strokeWidth={2} />
            Registrar gasto
          </Button>
        </div>

        <div className="space-y-2">
          {expenses.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía no has registrado gastos.</p>
          )}
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-card p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                {e.due_day ? <CalendarClock className="size-4" strokeWidth={1.8} /> : <Receipt className="size-4" strokeWidth={1.8} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.category}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDay(e.expense_date)}
                  {e.description && ` · ${e.description}`}
                </p>
                {e.due_day && (
                  <p className="mt-0.5 text-xs text-amber-400">
                    Vence el día {e.due_day} de cada mes
                  </p>
                )}
              </div>
              <p className={`shrink-0 font-display text-sm font-semibold tabular-nums ${isOtherIncome(e.category) ? 'text-primary' : ''}`}>
                {isOtherIncome(e.category) ? `+${cop(e.amount)}` : cop(e.amount)}
              </p>
              <button
                type="button"
                onClick={() => remove(e.id)}
                disabled={pending}
                aria-label="Eliminar gasto"
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </SettingsSubpage>
  )
}
