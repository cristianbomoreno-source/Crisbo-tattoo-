'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarPlus, Check, Search, UserRound, X } from 'lucide-react'

import {
  createClientAction,
  findClientProjectsByPhoneAction,
  getClientBookingMatchAction,
  searchClientsAction,
  type ClientBookingMatch,
} from '@/actions/clients'
import { createProjectAction, getProjectMoneyAction, updateProjectValueAction } from '@/actions/projects'
import { createPaymentAction } from '@/actions/payments'
import { cop } from '@/lib/projects/metrics'
import { createSessionAction, createSessionsBulkAction } from '@/actions/sessions'
import { deliverBookingConfirmation } from '@/lib/booking-confirmation-client'
import { PhoneInput } from '@/components/shared/phone-input'
import { DurationDial } from '@/components/sessions/duration-dial'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NEW_PROJECT = '__new__'

/** "460000" → "460.000" (solo dígitos). */
const formatMoney = (digits: string) => (digits ? Number(digits).toLocaleString('es-CO') : '')
const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 10)

/** "2026-11-20" + 7 → "2026-11-27". */
function addDays(dayKey: string, days: number) {
  const d = new Date(`${dayKey}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const MAX_SESSIONS = 6
type ExtraSession = { date: string; time: string }

/**
 * Popup de "agendar cita" al tocar un hueco vacío del calendario (día).
 * Al escribir el teléfono busca si ya es cliente y, si tiene proyectos
 * activos, deja elegir cuál usar en vez de crear uno nuevo cada vez. Si es
 * cliente nuevo (o no tiene ninguno activo) lo dice explícitamente ("se
 * creará un cliente nuevo") y deja nombrar el proyecto nuevo en vez de
 * imponer siempre "Cita rápida" — arma cliente → proyecto → sesión, todo
 * de una.
 */
export function QuickScheduleDialog({
  dayKey,
  defaultTime,
  open,
  onOpenChange,
  presetProjectId,
  presetClientName,
  presetPhone,
  presetClientId,
  presetDurationMinutes,
  onScheduled,
  onBooked,
  editableTime = false,
  onViewDay,
  extraActions,
}: {
  dayKey: string
  defaultTime: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si viene de un proyecto ya creado (ej. cotización rápida convertida),
   * se agenda directo ahí — se saltan cliente/proyecto y la búsqueda por
   * teléfono. */
  presetProjectId?: string
  presetClientName?: string
  presetPhone?: string
  /** Cliente ya conocido (ej. el vinculado al chat de Mensajes): se carga
   * directo, sin depender de la búsqueda por teléfono. */
  presetClientId?: string
  /** Duración por sesión ya cotizada para ese proyecto (ej. "5h" -> 300
   * min) — precarga el dial en vez de quedar siempre en 60 min. */
  presetDurationMinutes?: number
  onScheduled?: () => void
  /** Si se pasa, la confirmación la manda quien llama (ej. la bandeja de
   * Mensajes, por la API) y NO se abre la pestaña de wa.me. */
  onBooked?: (sessionId: string, otherSessionIds?: string[]) => void
  /** Muestra un selector de hora (cuando se abre tocando un día del mes,
   * no un hueco concreto del calendario). */
  editableTime?: boolean
  /** Enlace "Ver agenda del día" (abre el calendario de ese día). */
  onViewDay?: () => void
  /** Botones extra junto a "Ver agenda del día" (ej. "Bloquear día" desde Inicio). */
  extraActions?: React.ReactNode
}) {
  const router = useRouter()
  const [name, setName] = useState(presetClientName ?? '')
  const [phone, setPhone] = useState(presetPhone ?? '')
  const [time, setTime] = useState(defaultTime)
  const [duration, setDuration] = useState(presetDurationMinutes ?? 60)
  // Sesiones 2, 3… de la misma pieza (la 1 es el día y hora de arriba).
  // Van atadas al día tocado: si abren otro día, arrancan otra vez en 1.
  const [extraState, setExtraState] = useState<{ day: string; list: ExtraSession[] }>({ day: dayKey, list: [] })
  const extra = extraState.day === dayKey ? extraState.list : []
  const setExtra = (list: ExtraSession[]) => setExtraState({ day: dayKey, list })
  const sessionCount = extra.length + 1

  /** Cada sesión nueva arranca una semana ("cada 8 días") después de la
   * anterior, a la misma hora; se puede cambiar. */
  function setSessionCount(n: number) {
    const next = extra.slice(0, n - 1)
    while (next.length < n - 1) {
      const last = next.at(-1) ?? { date: dayKey, time }
      next.push({ date: addDays(last.date, 7), time: last.time || time })
    }
    setExtra(next)
  }
  const setExtraAt = (i: number, patch: Partial<ExtraSession>) =>
    setExtra(extra.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const [loading, setLoading] = useState(false)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [match, setMatch] = useState<ClientBookingMatch | null>(null)
  // Autocompletar por nombre.
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; phone: string | null }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchSeq = useRef(0)
  const [projectChoice, setProjectChoice] = useState<string>(NEW_PROJECT)
  const [projectName, setProjectName] = useState('Cita rápida')
  // Valor del proyecto y abono de esta cita (solo dígitos). Lo escrito vale
  // para el proyecto elegido; al cambiar de proyecto se precarga su valor.
  const [presetMoney, setPresetMoney] = useState<{ totalValue: number | null; paid: number } | null>(null)
  const projectKey = presetProjectId ?? projectChoice
  const money = presetProjectId
    ? presetMoney
    : (match?.projects.find((p) => p.id === projectChoice) ?? null)
  const [valueEdit, setValueEdit] = useState<{ key: string; v: string } | null>(null)
  const [depositEdit, setDepositEdit] = useState<{ key: string; v: string } | null>(null)
  const value =
    valueEdit?.key === projectKey ? valueEdit.v : money?.totalValue ? String(Math.round(money.totalValue)) : ''
  const deposit = depositEdit?.key === projectKey ? depositEdit.v : ''
  const setValue = (v: string) => setValueEdit({ key: projectKey, v })
  const setDeposit = (v: string) => setDepositEdit({ key: projectKey, v })
  const paid = money?.paid ?? 0
  const valueNum = Number(value || 0)
  const depositNum = Number(deposit || 0)
  const balance = valueNum > 0 ? valueNum - paid : null

  useEffect(() => {
    if (!open || !presetProjectId) return
    getProjectMoneyAction(presetProjectId).then((res) => setPresetMoney(res.success ? res.data : null))
  }, [open, presetProjectId])

  // La hora tocada en el calendario llega por props; si cambia mientras el
  // popup está cerrado (tocaron otro hueco), se sincroniza al reabrir.
  useEffect(() => {
    if (open) setTime(defaultTime)
  }, [open, defaultTime])
  async function loadPresetClient(id: string) {
    setCheckingPhone(true)
    const res = await getClientBookingMatchAction(id)
    setCheckingPhone(false)
    if (res.success) applyMatch(res.data)
    else if (presetPhone) handlePhoneBlur()
  }

  function applyMatch(m: ClientBookingMatch) {
    setMatch(m)
    setName(m.clientName)
    if (m.phone) setPhone(m.phone)
    setProjectChoice(m.projects[0]?.id ?? NEW_PROJECT)
    setSuggestions([])
    setShowSuggestions(false)
  }

  function clearMatch() {
    setMatch(null)
    setProjectChoice(NEW_PROJECT)
  }

  /** Escribir el nombre: si ya había un cliente elegido y el nombre cambia,
   * se suelta (sería otro cliente) y se buscan coincidencias. */
  function handleNameChange(value: string) {
    setName(value)
    if (match && value !== match.clientName) clearMatch()
    const seq = ++searchSeq.current
    if (value.trim().length < 2) {
      setSuggestions([])
      return
    }
    setShowSuggestions(true)
    setTimeout(async () => {
      if (seq !== searchSeq.current) return
      const res = await searchClientsAction(value)
      if (seq !== searchSeq.current) return
      setSuggestions(res.success ? res.data : [])
    }, 250)
  }

  async function pickSuggestion(id: string) {
    searchSeq.current++
    setShowSuggestions(false)
    setCheckingPhone(true)
    const res = await getClientBookingMatchAction(id)
    setCheckingPhone(false)
    if (res.success) applyMatch(res.data)
    else toast.error(res.error.message)
  }

  async function handlePhoneBlur() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) {
      setMatch(null)
      setProjectChoice(NEW_PROJECT)
      return
    }
    setCheckingPhone(true)
    const res = await findClientProjectsByPhoneAction(phone)
    setCheckingPhone(false)
    if (res.success && res.data) {
      // Sin tocar el teléfono que se está escribiendo.
      applyMatch({ ...res.data, phone: null })
    } else {
      setMatch(null)
      setProjectChoice(NEW_PROJECT)
    }
  }

  // Teléfono precargado (ej. desde un chat): buscar el cliente de una vez,
  // sin esperar el blur — si no, se crearía un cliente duplicado.
  useEffect(() => {
    if (!open || presetProjectId) return
    if (presetClientId) {
      // Carga asíncrona del cliente del chat (muestra "Buscando cliente…").
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPresetClient(presetClientId)
    } else if (presetPhone) {
      handlePhoneBlur()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetPhone, presetClientId, presetProjectId])

  async function handleSubmit() {
    if (!presetProjectId && name.trim().length < 2) {
      toast.error('Ponle un nombre al cliente')
      return
    }
    if (!time) {
      toast.error('Elige una hora')
      return
    }
    if (extra.some((s) => !s.date || !s.time)) {
      toast.error('Ponle día y hora a todas las sesiones')
      return
    }
    if (depositNum > 0 && balance !== null && depositNum > balance) {
      toast.error(`El abono supera el saldo del proyecto (${cop(Math.max(balance, 0))})`)
      return
    }
    setLoading(true)
    let projectId = presetProjectId ?? null

    if (!projectId) {
      let clientId = match?.clientId ?? null
      // La búsqueda por teléfono pudo no haber terminado (o no haberse
      // disparado) antes de tocar "Agendar": se repite aquí para no intentar
      // crear un cliente que ya existe (el teléfono es único por estudio).
      if (!clientId && phone.replace(/\D/g, '').length >= 7) {
        const found = await findClientProjectsByPhoneAction(phone)
        if (found.success && found.data) {
          clientId = found.data.clientId
        }
      }
      if (!clientId) {
        const clientRes = await createClientAction({ name: name.trim(), phone: phone || undefined })
        if (!clientRes.success) {
          toast.error(clientRes.error.message)
          setLoading(false)
          return
        }
        clientId = clientRes.data.id
      }

      projectId = projectChoice !== NEW_PROJECT ? projectChoice : null
      if (!projectId) {
        const projectRes = await createProjectAction({
          client_id: clientId,
          name: projectName.trim() || 'Cita rápida',
          ...(valueNum > 0 ? { total_value: valueNum } : {}),
        })
        if (!projectRes.success) {
          toast.error(projectRes.error.message)
          setLoading(false)
          return
        }
        projectId = projectRes.data.id
      }
    }

    // Proyecto existente con valor nuevo o cambiado.
    const existing = presetProjectId || projectChoice !== NEW_PROJECT
    if (existing && valueNum > 0 && valueNum !== Math.round(money?.totalValue ?? 0)) {
      const res = await updateProjectValueAction(projectId, { total_value: valueNum })
      if (!res.success) toast.error(`No se actualizó el valor: ${res.error.message}`)
    }

    // Varias sesiones van en lote: si una choca o cae en día cerrado no se
    // agenda ninguna.
    const firstAt = `${dayKey}T${time}`
    let firstId: string
    let otherIds: string[] = []
    if (extra.length === 0) {
      const sessionRes = await createSessionAction({ project_id: projectId, scheduled_at: firstAt, duration_minutes: duration })
      if (!sessionRes.success) {
        setLoading(false)
        toast.error(sessionRes.error.message)
        return
      }
      firstId = sessionRes.data.id
    } else {
      const bulkRes = await createSessionsBulkAction(projectId, {
        sessions: [{ date: dayKey, time }, ...extra].map((s) => ({ scheduled_at: `${s.date}T${s.time}`, duration_minutes: duration })),
      })
      if (!bulkRes.success) {
        setLoading(false)
        toast.error(bulkRes.error.message)
        return
      }
      const first = bulkRes.data.find((s) => s.scheduled_at.slice(0, 16) === firstAt) ?? bulkRes.data[0]!
      firstId = first.id
      otherIds = bulkRes.data.filter((s) => s.id !== first.id).map((s) => s.id)
    }
    setLoading(false)

    // El abono queda como pago de la primera cita (antes del mensaje de
    // confirmación, que muestra valor, abonado y saldo).
    if (depositNum > 0) {
      const payRes = await createPaymentAction({ project_id: projectId, session_id: firstId, amount: depositNum })
      if (!payRes.success) toast.error(`Cita agendada, pero el abono no se guardó: ${payRes.error.message}`)
    }

    const booked = extra.length ? `${sessionCount} sesiones agendadas` : 'Cita agendada'
    toast.success(depositNum > 0 ? `${booked} · abono de ${cop(depositNum)}` : booked)
    onOpenChange(false)
    setExtra([])
    setValueEdit(null)
    setDepositEdit(null)
    setName(presetClientName ?? '')
    setPhone(presetPhone ?? '')
    setMatch(null)
    setSuggestions([])
    setProjectChoice(NEW_PROJECT)
    setProjectName('Cita rápida')
    onScheduled?.()
    router.refresh()

    if (onBooked) {
      onBooked(firstId, otherIds)
      return
    }
    await deliverBookingConfirmation(firstId, otherIds)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-4 text-primary" strokeWidth={2} />
            Agendar cita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {editableTime ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-sm font-medium text-primary">
                {dayKey}
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Hora de la cita"
                disabled={loading}
                className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-sm font-medium text-primary">
              {dayKey} · {time || '—'}
            </div>
          )}
          {(onViewDay || extraActions) && (
            <div className="flex items-center justify-between gap-3">
              {onViewDay ? (
                <button type="button" onClick={onViewDay} className="text-xs font-medium text-primary hover:underline">
                  Ver agenda del día
                </button>
              ) : (
                <span />
              )}
              {extraActions}
            </div>
          )}

          {presetProjectId ? (
            <p className="rounded-lg bg-accent px-3 py-2 text-sm">
              Para: <span className="font-medium">{presetClientName || 'Cliente'}</span>
            </p>
          ) : (
            <>
              {/* Nombre con autocompletar: lo más rápido para un cliente que ya existe. */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Buscar o escribir nombre del cliente"
                  autoComplete="off"
                  disabled={loading}
                  role="combobox"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-controls="quick-schedule-client-list"
                  className="h-11 w-full rounded-xl border border-input bg-transparent pr-9 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                {match && (
                  <button
                    type="button"
                    onClick={() => {
                      clearMatch()
                      setName('')
                      setPhone('')
                    }}
                    aria-label="Quitar cliente elegido"
                    className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
                {showSuggestions && !match && suggestions.length > 0 && (
                  <ul
                    id="quick-schedule-client-list"
                    role="listbox"
                    className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl bg-popover p-1 shadow-lg ring-1 ring-foreground/10"
                  >
                    {suggestions.map((c) => (
                      <li key={c.id} role="option" aria-selected={false}>
                        <button
                          type="button"
                          // onMouseDown: se dispara antes del blur del input.
                          onMouseDown={(e) => {
                            e.preventDefault()
                            pickSuggestion(c.id)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-accent"
                        >
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                            <UserRound className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{c.name}</span>
                            {c.phone && <span className="block truncate text-xs text-muted-foreground">{c.phone}</span>}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <PhoneInput value={phone} onChange={setPhone} onBlur={() => !match && handlePhoneBlur()} />
              {checkingPhone ? (
                <p className="text-xs text-muted-foreground">Buscando cliente…</p>
              ) : match ? (
                <p className="flex items-center gap-1 text-xs text-primary">
                  <Check className="size-3.5" />
                  Cliente: {match.clientName}
                  {match.projects.length === 0 && ' (sin proyectos activos)'}
                </p>
              ) : (
                name.trim().length >= 2 && (
                  <p className="text-xs text-muted-foreground">
                    No elegiste un cliente de la lista — se creará un cliente nuevo.
                  </p>
                )
              )}

              {match && match.projects.length > 0 ? (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-muted-foreground">Proyecto</label>
                  <Select
                    items={{
                      ...Object.fromEntries(match.projects.map((p) => [p.id, p.name])),
                      [NEW_PROJECT]: '+ Nuevo proyecto',
                    }}
                    value={projectChoice}
                    onValueChange={(v) => v && setProjectChoice(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {match.projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW_PROJECT}>+ Nuevo proyecto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {projectChoice === NEW_PROJECT && (
                <div className="space-y-1">
                  <label htmlFor="quick-schedule-project-name" className="block text-xs font-medium text-muted-foreground">
                    Nombre del proyecto nuevo
                  </label>
                  <input
                    id="quick-schedule-project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Cita rápida"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              )}
            </>
          )}

          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="quick-schedule-value" className="block text-xs font-medium text-muted-foreground">
                  Valor del proyecto
                </label>
                <input
                  id="quick-schedule-value"
                  inputMode="numeric"
                  value={value ? `$${formatMoney(value)}` : ''}
                  onChange={(e) => setValue(onlyDigits(e.target.value))}
                  placeholder="$0"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm tabular-nums outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="quick-schedule-deposit" className="block text-xs font-medium text-muted-foreground">
                  Abono de esta cita
                </label>
                <input
                  id="quick-schedule-deposit"
                  inputMode="numeric"
                  value={deposit ? `$${formatMoney(deposit)}` : ''}
                  onChange={(e) => setDeposit(onlyDigits(e.target.value))}
                  placeholder="$0"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm tabular-nums outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
            {(paid > 0 || (balance !== null && depositNum > 0)) && (
              <p className={`text-xs ${balance !== null && depositNum > balance ? 'text-destructive' : 'text-muted-foreground'}`}>
                {paid > 0 && `Ya abonó ${cop(paid)}`}
                {paid > 0 && balance !== null && ' · '}
                {balance !== null && `Saldo ${cop(Math.max(balance - depositNum, 0))}${depositNum > 0 ? ' después de este abono' : ''}`}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <DurationDial value={duration} onChange={setDuration} />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-muted-foreground">
              Sesiones{sessionCount > 1 && ' · todas con la misma duración'}
            </span>
            <div role="radiogroup" aria-label="Número de sesiones" className="grid grid-cols-6 gap-1 rounded-xl bg-muted p-1">
              {Array.from({ length: MAX_SESSIONS }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={sessionCount === n}
                  onClick={() => setSessionCount(n)}
                  disabled={loading}
                  className={`h-8 rounded-lg text-sm font-medium tabular-nums transition-colors ${
                    sessionCount === n ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {extra.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">Sesión {i + 2}</span>
                <input
                  type="date"
                  value={s.date}
                  onChange={(e) => setExtraAt(i, { date: e.target.value })}
                  aria-label={`Día de la sesión ${i + 2}`}
                  disabled={loading}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <input
                  type="time"
                  value={s.time}
                  onChange={(e) => setExtraAt(i, { time: e.target.value })}
                  aria-label={`Hora de la sesión ${i + 2}`}
                  disabled={loading}
                  className="h-10 w-28 shrink-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            ))}
          </div>

          <Button type="button" className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Agendando…' : sessionCount > 1 ? `Agendar ${sessionCount} sesiones` : 'Agendar cita'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
