'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { MessageCircle, ArrowUpRight, Trash2, Wallet, ChevronLeft, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getBookingConfirmationLinkAction,
  deleteSessionAction,
  getSessionPopupInfoAction,
  type SessionPopupInfo,
} from '@/actions/sessions'
import { createPaymentAction } from '@/actions/payments'
import { ConfirmationMenu } from '@/components/sessions/confirmation-menu'
import { openWhatsAppTab, redirectWhatsAppTab } from '@/lib/whatsapp-client'
import { formatTime } from '@/lib/calendar/utils'
import { cop } from '@/lib/projects/metrics'
import { PAYMENT_METHOD_OPTIONS } from '@/lib/validations/studio'
import type { SessionWithProject } from '@/queries/sessions'

const photoTexture: React.CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(135deg, var(--muted) 0 11px, var(--card) 11px 22px)',
}

/**
 * Se abre al TOCAR (tap corto) una cita ya agendada en la vista Día del
 * calendario -- distinto del menú de mantener presionada
 * (`SessionActionsDialog`, que es Reagendar/Eliminar). Encabezado con la
 * foto más reciente del proyecto y su saldo; acciones: cobrar (paso de pago
 * dentro del mismo popup, el pago queda ligado a esta sesión), mandar la
 * confirmación por WhatsApp, ir a la ficha del proyecto o cancelar la cita.
 */
export function SessionConfirmDialog({
  session,
  open,
  onOpenChange,
  onGoToProject,
  onDeleted,
  onPaid,
  onStatusChanged,
  initialMode = 'menu',
}: {
  session: SessionWithProject | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoToProject: (session: SessionWithProject) => void
  onDeleted?: () => void
  /** Tras registrar un pago (el calendario marca las sesiones ya pagadas). */
  onPaid?: () => void
  /** Tras cambiar a mano el estado (confirmada / por confirmar / cancelada). */
  onStatusChanged?: () => void
  /** 'pay' abre directo en "Registrar pago" (botón Cobrar de la tarjeta de
   * Inicio); al pagar o tocar Volver se cierra en vez de ir al menú. */
  initialMode?: 'menu' | 'pay'
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState<'menu' | 'pay' | 'confirmDelete'>('menu')
  const [deleting, setDeleting] = useState(false)
  const [info, setInfo] = useState<SessionPopupInfo | null>(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [paying, setPaying] = useState(false)

  const projectId = session?.project_id

  function loadInfo(id: string) {
    getSessionPopupInfoAction(id).then((res) => {
      if (!res.success) return
      setInfo(res.data)
      if (initialMode === 'pay') {
        const pending = Math.max(res.data.totalValue - res.data.paid, 0)
        setAmount(pending > 0 ? String(Math.round(pending)) : '')
      }
    })
  }

  useEffect(() => {
    if (open) {
      // Reinicia el popup cada vez que se abre con otra cita.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSending(false)
      setMode(initialMode)
      setAmount('')
      setMethod('')
      setInfo(null)
      if (projectId) loadInfo(projectId)
    }
  }, [open, session?.id, projectId, initialMode])

  if (!session) return null

  const clientName = session.projects?.clients?.name ?? session.projects?.name ?? 'Sesión'
  const balance = info ? Math.max(info.totalValue - info.paid, 0) : null
  const methods = info?.paymentMethods?.length ? info.paymentMethods : [...PAYMENT_METHOD_OPTIONS]

  async function handleConfirm() {
    if (!session) return
    setSending(true)
    // Abrir YA, síncrono con el tap -- si se espera la respuesta del
    // servidor antes de abrir, Safari/iOS bloquea el popup.
    const waTab = openWhatsAppTab()
    const linkRes = await getBookingConfirmationLinkAction(session.id)
    setSending(false)
    if (!linkRes.success) {
      toast.error(linkRes.error.message)
      redirectWhatsAppTab(waTab, null)
      return
    }
    if (!linkRes.data.link) {
      toast.error('Este cliente no tiene teléfono guardado')
      redirectWhatsAppTab(waTab, null)
      return
    }
    redirectWhatsAppTab(waTab, linkRes.data.link)
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!session) return
    setDeleting(true)
    const result = await deleteSessionAction(session.id)
    setDeleting(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Cita cancelada')
    onOpenChange(false)
    onDeleted?.()
  }

  function startPay() {
    setAmount(balance && balance > 0 ? String(Math.round(balance)) : '')
    setMode('pay')
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    const value = Number(amount.replace(/[^\d]/g, ''))
    if (!value || value <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    setPaying(true)
    const result = await createPaymentAction({
      project_id: session.project_id,
      session_id: session.id,
      amount: value,
      payment_method: method || undefined,
    })
    setPaying(false)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Pago registrado')
    if (initialMode === 'pay') {
      onPaid?.()
      onOpenChange(false)
      router.refresh()
      return
    }
    setMode('menu')
    loadInfo(session.project_id)
    onPaid?.()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[90vh] max-w-sm gap-0 overflow-y-auto p-0">
        {/* ===== Encabezado: foto del proyecto ===== */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-card">
          {info?.coverUrl ? (
            <NextImage
              src={info.coverUrl}
              alt={session.projects?.name ?? clientName}
              fill
              className="object-cover"
              sizes="384px"
            />
          ) : (
            <div className="grid h-full place-items-center" style={photoTexture}>
              <ImageIcon className="size-7 text-muted-foreground/25" strokeWidth={1.4} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <DialogTitle className="truncate font-title text-xl font-bold leading-tight text-white">
              {mode === 'confirmDelete' ? 'Cancelar cita' : mode === 'pay' ? 'Registrar pago' : clientName}
            </DialogTitle>
            <p className="mt-0.5 truncate text-sm text-white/75">
              {formatTime(session.scheduled_at)} · {session.projects?.name ?? ''}
            </p>
          </div>
          {/* Cerrar: sobre la foto, con fondo propio para que se vea. */}
          <DialogClose
            aria-label="Cerrar"
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
          >
            <X className="size-4" strokeWidth={2} />
          </DialogClose>
          {balance !== null && info && info.totalValue > 0 && (
            <span
              className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${
                balance <= 0 ? 'bg-emerald-500/90 text-white' : 'bg-black/55 text-white'
              }`}
            >
              {balance <= 0 ? 'Pagado ✓' : `Saldo ${cop(balance)}`}
            </span>
          )}
        </div>

        <div className="space-y-4 p-4">
          {mode === 'menu' && (
            <>
              {session.status !== 'completed' && (
                <ConfirmationMenu
                  sessionId={session.id}
                  confirmation={session.confirmation ?? null}
                  onChanged={() => {
                    onStatusChanged?.()
                    router.refresh()
                  }}
                  className="w-full justify-center"
                />
              )}

              {info && info.totalValue > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Valor" value={cop(info.totalValue)} />
                  <Stat label="Pagado" value={cop(info.paid)} />
                  <Stat label="Saldo" value={cop(balance ?? 0)} highlight={!!balance && balance > 0} />
                </div>
              )}

              <div className="grid gap-2">
                <Button
                  type="button"
                  className="justify-start gap-2"
                  onClick={startPay}
                  disabled={!info || (info.totalValue > 0 && (balance ?? 0) <= 0)}
                >
                  <Wallet className="size-4" strokeWidth={2} />
                  {info && info.totalValue > 0 && (balance ?? 0) <= 0 ? 'Proyecto pagado' : 'Registrar pago'}
                </Button>
                <Button
                  type="button"
                  className="justify-start gap-2 bg-[#25D366] text-white hover:bg-[#25D366]/90"
                  onClick={handleConfirm}
                  disabled={sending}
                >
                  <MessageCircle className="size-4" strokeWidth={2} />
                  {sending ? 'Abriendo…' : 'Confirmar cita'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => onGoToProject(session)}
                >
                  <ArrowUpRight className="size-4" strokeWidth={2} />
                  Ver proyecto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => setMode('confirmDelete')}
                >
                  <Trash2 className="size-4" strokeWidth={2} />
                  Cancelar cita
                </Button>
              </div>
            </>
          )}

          {mode === 'pay' && (
            <form onSubmit={handlePay} className="space-y-4">
              {balance !== null && balance > 0 && (
                <p className="text-sm text-muted-foreground">
                  Saldo pendiente: <span className="font-semibold text-foreground tabular-nums">{cop(balance)}</span>
                </p>
              )}
              <div className="space-y-1.5">
                <label htmlFor="session-pay-amount" className="block text-xs text-muted-foreground">
                  Monto recibido (COP)
                </label>
                <Input
                  id="session-pay-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <span className="block text-xs text-muted-foreground">Método de pago</span>
                <div className="flex flex-wrap gap-1.5">
                  {methods.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m === method ? '' : m)}
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
              {info && info.payments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Abonos anteriores</p>
                  <ul className="space-y-1">
                    {info.payments.slice(0, 4).map((p) => (
                      <li key={p.id} className="flex justify-between rounded-xl bg-background px-3 py-2 text-xs">
                        <span className="text-muted-foreground">
                          {new Date(p.paid_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          {p.payment_method ? ` · ${p.payment_method}` : ''}
                        </span>
                        <span className="font-semibold tabular-nums">{cop(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => (initialMode === 'pay' ? onOpenChange(false) : setMode('menu'))}
                  disabled={paying}
                >
                  <ChevronLeft className="size-4" />
                  Volver
                </Button>
                <Button type="submit" className="flex-1" disabled={paying}>
                  {paying ? 'Guardando…' : 'Registrar pago'}
                </Button>
              </div>
            </form>
          )}

          {mode === 'confirmDelete' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Cancelar la cita con <span className="font-medium text-foreground">{clientName}</span>? Esta acción
                no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMode('menu')} disabled={deleting}>
                  Volver
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Cancelando…' : 'Sí, cancelar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-background px-2 py-2.5">
      <p className={`truncate text-sm font-semibold tabular-nums ${highlight ? 'text-primary' : ''}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
