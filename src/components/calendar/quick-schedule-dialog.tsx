'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarPlus } from 'lucide-react'

import { createClientAction, findClientProjectsByPhoneAction } from '@/actions/clients'
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
  presetDurationMinutes,
  onScheduled,
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
  /** Duración por sesión ya cotizada para ese proyecto (ej. "5h" -> 300
   * min) — precarga el dial en vez de quedar siempre en 60 min. */
  presetDurationMinutes?: number
  onScheduled?: () => void
}) {
  const router = useRouter()
  const [name, setName] = useState(presetClientName ?? '')
  const [phone, setPhone] = useState(presetPhone ?? '')
  const [time, setTime] = useState(defaultTime)
  const [duration, setDuration] = useState(presetDurationMinutes ?? 60)
  const [loading, setLoading] = useState(false)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [match, setMatch] = useState<{
    clientId: string
    clientName: string
    projects: { id: string; name: string }[]
  } | null>(null)
  const [projectChoice, setProjectChoice] = useState<string>(NEW_PROJECT)
  const [projectName, setProjectName] = useState('Cita rápida')

  // La hora tocada en el calendario llega por props; si cambia mientras el
  // popup está cerrado (tocaron otro hueco), se sincroniza al reabrir.
  useEffect(() => {
    if (open) setTime(defaultTime)
  }, [open, defaultTime])

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
      setMatch(res.data)
      setName(res.data.clientName)
      setProjectChoice(res.data.projects[0]?.id ?? NEW_PROJECT)
    } else {
      setMatch(null)
      setProjectChoice(NEW_PROJECT)
    }
  }

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
    const waTab = openWhatsAppTab()

    let projectId = presetProjectId ?? null

    if (!projectId) {
      let clientId = match?.clientId ?? null
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
    setProjectChoice(NEW_PROJECT)
    setProjectName('Cita rápida')
    onScheduled?.()
    router.refresh()

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
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-sm font-medium text-primary">
            {dayKey} · {time || '—'}
          </div>

          {presetProjectId ? (
            <p className="rounded-lg bg-accent px-3 py-2 text-sm">
              Para: <span className="font-medium">{presetClientName || 'Cliente'}</span>
            </p>
          ) : (
            <>
              <PhoneInput value={phone} onChange={setPhone} onBlur={handlePhoneBlur} />
              {checkingPhone && (
                <p className="text-xs text-muted-foreground">Buscando cliente…</p>
              )}
              {match ? (
                <p className="text-xs text-primary">
                  Cliente encontrado: {match.clientName}
                  {match.projects.length === 0 && ' (sin proyectos activos)'}
                </p>
              ) : (
                phone.replace(/\D/g, '').length >= 7 && !checkingPhone && (
                  <p className="text-xs text-muted-foreground">
                    No encontramos ese teléfono — se creará un cliente nuevo.
                  </p>
                )
              )}

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                disabled={loading}
                className="h-11 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />

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
