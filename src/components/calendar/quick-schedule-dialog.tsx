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
import { createProjectAction } from '@/actions/projects'
import { createSessionAction, getBookingConfirmationLinkAction } from '@/actions/sessions'
import { openWhatsAppTab, redirectWhatsAppTab } from '@/lib/whatsapp-client'
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
  onBooked?: (sessionId: string) => void
  /** Muestra un selector de hora (cuando se abre tocando un día del mes,
   * no un hueco concreto del calendario). */
  editableTime?: boolean
  /** Enlace "Ver agenda del día" (abre el calendario de ese día). */
  onViewDay?: () => void
}) {
  const router = useRouter()
  const [name, setName] = useState(presetClientName ?? '')
  const [phone, setPhone] = useState(presetPhone ?? '')
  const [time, setTime] = useState(defaultTime)
  const [duration, setDuration] = useState(presetDurationMinutes ?? 60)
  const [loading, setLoading] = useState(false)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [match, setMatch] = useState<ClientBookingMatch | null>(null)
  // Autocompletar por nombre.
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; phone: string | null }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchSeq = useRef(0)
  const [projectChoice, setProjectChoice] = useState<string>(NEW_PROJECT)
  const [projectName, setProjectName] = useState('Cita rápida')

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
    setLoading(true)
    // Se abre YA (síncrono con el tap del botón) para que Safari/iOS no
    // bloquee el popup -- se redirige más abajo cuando ya se tiene el link
    // real, o se cierra sola si algo falla o el cliente no tiene teléfono.
    const waTab = onBooked ? null : openWhatsAppTab()

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
          redirectWhatsAppTab(waTab, null)
          return
        }
        clientId = clientRes.data.id
      }

      projectId = projectChoice !== NEW_PROJECT ? projectChoice : null
      if (!projectId) {
        const projectRes = await createProjectAction({
          client_id: clientId,
          name: projectName.trim() || 'Cita rápida',
        })
        if (!projectRes.success) {
          toast.error(projectRes.error.message)
          setLoading(false)
          redirectWhatsAppTab(waTab, null)
          return
        }
        projectId = projectRes.data.id
      }
    }

    const sessionRes = await createSessionAction({
      project_id: projectId,
      scheduled_at: `${dayKey}T${time}`,
      duration_minutes: duration,
    })
    setLoading(false)
    if (!sessionRes.success) {
      toast.error(sessionRes.error.message)
      redirectWhatsAppTab(waTab, null)
      return
    }

    toast.success('Cita agendada')
    onOpenChange(false)
    setName(presetClientName ?? '')
    setPhone(presetPhone ?? '')
    setMatch(null)
    setSuggestions([])
    setProjectChoice(NEW_PROJECT)
    setProjectName('Cita rápida')
    onScheduled?.()
    router.refresh()

    if (onBooked) {
      onBooked(sessionRes.data.id)
      return
    }
    const linkRes = await getBookingConfirmationLinkAction(sessionRes.data.id)
    redirectWhatsAppTab(waTab, linkRes.success ? linkRes.data.link : null)
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
          {onViewDay && (
            <button type="button" onClick={onViewDay} className="text-xs font-medium text-primary hover:underline">
              Ver agenda del día
            </button>
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

          <div className="flex gap-2">
            <div className="flex-1">
              <DurationDial value={duration} onChange={setDuration} />
            </div>
          </div>

          <Button type="button" className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Agendando…' : 'Agendar cita'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
