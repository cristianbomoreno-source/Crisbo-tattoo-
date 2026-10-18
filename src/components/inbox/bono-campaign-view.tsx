'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Gift, Loader2, MessageCircle, RefreshCw, Search, Send, Trash2, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BONO_IMAGE_PATH, BONO_NAME, BONO_TEMPLATE } from '@/lib/campaigns/bono'
import { renderTemplate } from '@/lib/campaigns/nuevos-trazos'
import type { BonoRecipient } from '@/queries/bono-campaign'
import {
  getBonoTemplateStatus,
  sendBonoTo,
  setBonoExcluded,
  setupBonoTemplate,
  type BonoTemplateStatus,
} from '@/actions/bono-campaign'
import { deleteClientsAction } from '@/actions/clients'

type Tab = 'nuevos' | 'todos' | 'enviados' | 'quitados'

const TEMPLATE_STATUS: Record<string, { label: string; className: string }> = {
  MISSING: { label: 'Sin crear', className: 'bg-muted text-muted-foreground' },
  PENDING: { label: 'En revisión', className: 'bg-amber-400/15 text-amber-700 dark:text-amber-300' },
  APPROVED: { label: 'Aprobada', className: 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-300' },
  REJECTED: { label: 'Rechazada', className: 'bg-destructive/15 text-destructive' },
}

const SEND_STATUS: Record<string, { label: string; className: string }> = {
  sent: { label: 'Enviado', className: 'bg-muted text-muted-foreground' },
  delivered: { label: 'Entregado', className: 'bg-sky-400/15 text-sky-700 dark:text-sky-300' },
  read: { label: 'Leído', className: 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-300' },
  failed: { label: 'No llegó', className: 'bg-destructive/15 text-destructive' },
}

/** Cuántas filas se pintan de una (la lista puede tener 2.000 clientes). */
const PAGE = 200
/** Costo aproximado por mensaje de Marketing entregado en Colombia (COP). */
const COST_PER_MESSAGE = 46

/** Campaña "Bono de agradecimiento": eliges a quién sí y a quién no. */
export function BonoCampaignView({
  recipients: initial,
  error,
  template: initialTemplate,
}: {
  recipients: BonoRecipient[]
  error: string | null
  template: BonoTemplateStatus | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('nuevos')
  const [query, setQuery] = useState('')
  const [template, setTemplate] = useState(initialTemplate)
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  // Borrado de la base: la X borra directo y la fila se esconde al instante.
  const [deleted, setDeleted] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const recipients = useMemo(
    () =>
      initial.filter((r) => !deleted.has(r.clientId)).map((r) => ({
        ...r,
        excluded: r.clientId in overrides ? overrides[r.clientId] === true : r.excluded,
      })),
    [initial, overrides, deleted]
  )
  const sent = (r: BonoRecipient) => !!r.sentStatus && r.sentStatus !== 'failed'
  const selectable = (r: BonoRecipient) => !r.excluded && !sent(r)
  const isNew = (r: BonoRecipient) => selectable(r) && !r.gotNuevosTrazos

  const counts = {
    nuevos: recipients.filter(isNew).length,
    todos: recipients.filter((r) => !r.excluded).length,
    enviados: recipients.filter(sent).length,
    quitados: recipients.filter((r) => r.excluded).length,
  }
  const wrote = recipients.filter((r) => r.wroteBack).length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    return recipients.filter(
      (r) =>
        (tab === 'nuevos'
          ? isNew(r)
          : tab === 'enviados'
            ? sent(r)
            : tab === 'quitados'
              ? r.excluded
              : !r.excluded) &&
        (!q || r.name.toLowerCase().includes(q) || (digits.length >= 3 && r.phone.replace(/\D/g, '').includes(digits)))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients, tab, query])

  const selectedList = recipients.filter((r) => selected.has(r.clientId) && selectable(r))
  const visibleSelectable = visible.filter(selectable)
  const allOn = visibleSelectable.length > 0 && visibleSelectable.every((r) => selected.has(r.clientId))
  const approved = template?.status === 'APPROVED'

  function toggle(id: string) {
    setConfirming(false)
    setConfirmBulkDelete(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setConfirming(false)
    setConfirmBulkDelete(false)
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of visibleSelectable) {
        if (allOn) next.delete(r.clientId)
        else next.add(r.clientId)
      }
      return next
    })
  }

  async function toggleExcluded(r: BonoRecipient, excluded: boolean) {
    setOverrides((o) => ({ ...o, [r.clientId]: excluded }))
    if (excluded) {
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(r.clientId)
        return next
      })
    }
    const res = await setBonoExcluded(r.clientId, excluded)
    if (!res.success) {
      setOverrides((o) => ({ ...o, [r.clientId]: !excluded }))
      return void toast.error(res.error.message)
    }
    toast.success(excluded ? `${r.firstName} salió de la lista` : `${r.firstName} volvió a la lista`)
  }

  /** Borra de la base de datos (con respaldo). Los que tienen historial no se tocan. */
  function removeClients(ids: string[]) {
    setConfirmBulkDelete(false)
    setDeleted((prev) => new Set([...prev, ...ids]))
    setBusy('delete')
    startTransition(async () => {
      const res = await deleteClientsAction(ids)
      setBusy(null)
      if (!res.success) {
        setDeleted((prev) => new Set([...prev].filter((id) => !ids.includes(id))))
        return void toast.error(res.error.message)
      }
      const { deleted: gone, skipped } = res.data
      if (skipped.length) {
        setDeleted((prev) => new Set([...prev].filter((id) => !skipped.includes(id))))
        toast.error(`${skipped.length} no se borraron: tienen proyectos, cotizaciones o consentimientos`)
      }
      if (gone.length) toast.success(gone.length === 1 ? 'Cliente borrado' : `${gone.length} clientes borrados`)
      setSelected((prev) => new Set([...prev].filter((id) => !gone.includes(id))))
      router.refresh()
    })
  }

  function createTemplate() {
    setBusy('setup')
    startTransition(async () => {
      const res = await setupBonoTemplate()
      setBusy(null)
      if (!res.success) return void toast.error(res.error.message)
      setTemplate(res.data)
      toast.success('Plantilla enviada a revisión de Meta')
    })
  }

  function refreshTemplate() {
    setBusy('refresh')
    startTransition(async () => {
      const res = await getBonoTemplateStatus()
      setBusy(null)
      if (!res.success) return void toast.error(res.error.message)
      setTemplate(res.data)
    })
  }

  function send() {
    const ids = selectedList.map((r) => r.clientId)
    setConfirming(false)
    setBusy('send')
    startTransition(async () => {
      const res = await sendBonoTo(ids)
      setBusy(null)
      if (!res.success) return void toast.error(res.error.message)
      const { sent: n, failed } = res.data
      if (n) toast.success(`${n} mensajes enviados`)
      if (failed.length) {
        toast.error(`${failed.length} no se enviaron: ${failed.slice(0, 3).map((f) => `${f.name} (${f.error})`).join(', ')}`)
      }
      setSelected(new Set())
      router.refresh()
    })
  }

  const st = TEMPLATE_STATUS[template?.status ?? 'MISSING'] ?? { label: template?.status ?? '', className: 'bg-muted' }

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link
          href="/dashboard/inbox/campaigns"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60"
          aria-label="Volver a campañas"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Gift className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-sm font-semibold">Campaña “{BONO_NAME}”</h2>
          <p className="truncate text-xs text-muted-foreground">
            {counts.nuevos} sin campañas · {counts.enviados} enviados · {wrote} respondieron
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 border-b border-border/60 p-3 sm:px-4">
          <div className="overflow-hidden rounded-xl bg-primary/10 text-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BONO_IMAGE_PATH}
              alt={BONO_NAME}
              className="max-h-64 w-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
            <p className="whitespace-pre-line p-3 text-muted-foreground">
              {renderTemplate(BONO_TEMPLATE.body, ['Laura'])}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 p-3 text-xs">
            <span className="font-semibold">Plantilla en Meta</span>
            <span className="flex items-center gap-2">
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', st.className)}>{st.label}</span>
              {template?.status === 'MISSING' ? (
                <button
                  type="button"
                  onClick={createTemplate}
                  disabled={pending}
                  className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {busy === 'setup' && <Loader2 className="size-3 animate-spin" />}
                  Crear
                </button>
              ) : (
                <button
                  type="button"
                  onClick={refreshTemplate}
                  disabled={pending}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-accent/60"
                >
                  <RefreshCw className={cn('size-3', busy === 'refresh' && 'animate-spin')} />
                  Actualizar
                </button>
              )}
            </span>
            {template?.reason && <span className="w-full text-[11px] text-destructive">{template.reason}</span>}
          </div>

          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
            {(['nuevos', 'todos', 'enviados', 'quitados'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key)
                  setLimit(PAGE)
                }}
                aria-pressed={tab === key}
                className={cn(
                  'rounded-lg py-1.5 text-[11px] font-medium transition-colors sm:text-xs',
                  tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {key === 'nuevos' ? 'Sin campañas' : key === 'todos' ? 'Todos' : key === 'enviados' ? 'Enviados' : 'Quitados'} (
                {counts[key]})
              </button>
            ))}
          </div>
          {tab === 'nuevos' && (
            <p className="text-xs text-muted-foreground">A estos no les ha llegado ninguna campaña.</p>
          )}
          <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimit(PAGE)
              }}
              placeholder="Buscar cliente o número"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          {tab !== 'enviados' && tab !== 'quitados' && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Toca a cada cliente para marcarlo. La X lo borra de la base de datos.</span>
              <button
                type="button"
                onClick={toggleAll}
                disabled={visibleSelectable.length === 0}
                className="shrink-0 rounded-md px-2 py-1 font-semibold text-primary hover:bg-accent/60 disabled:opacity-40"
              >
                {allOn ? 'Desmarcar todos' : `Marcar todos (${visibleSelectable.length})`}
              </button>
            </div>
          )}
        </div>

        <ul className="divide-y divide-border/60">
          {error && <li className="p-6 text-center text-sm text-destructive">No se pudo cargar la lista: {error}</li>}
          {!error && visible.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">No hay clientes en esta lista.</li>
          )}
          {visible.slice(0, limit).map((r) => {
            const s = r.sentStatus ? SEND_STATUS[r.sentStatus] ?? SEND_STATUS.sent : null
            const canPick = selectable(r)
            const picked = canPick && selected.has(r.clientId)
            return (
              <li
                key={r.clientId}
                onClick={canPick ? () => toggle(r.clientId) : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 sm:px-4',
                  canPick && 'cursor-pointer hover:bg-accent/40',
                  picked && 'bg-primary/10'
                )}
              >
                <span
                  role="checkbox"
                  aria-checked={picked}
                  aria-label={`Elegir a ${r.firstName}`}
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    !canPick
                      ? 'border-transparent bg-muted text-xs font-semibold text-muted-foreground'
                      : picked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-transparent'
                  )}
                >
                  {canPick ? <Check className="size-4" strokeWidth={3} /> : r.firstName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.firstName}
                    <span className="ml-1.5 font-normal text-muted-foreground">{r.name}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{r.phone}</p>
                  {(s || r.gotNuevosTrazos || r.wroteBack) && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {s && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', s.className)}>
                          {s.label}
                        </span>
                      )}
                      {r.wroteBack && (
                        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                          Escribió
                        </span>
                      )}
                      {r.gotNuevosTrazos && (
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
                          Recibió Nuevos Trazos
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {r.excluded ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExcluded(r, false)
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    aria-label={`Devolver a ${r.firstName}`}
                    title="Devolver a la lista"
                  >
                    <Undo2 className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeClients([r.clientId])
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Borrar a ${r.firstName} de la base de datos`}
                    title="Borrar de la base de datos"
                  >
                    <X className="size-4" />
                  </button>
                )}
                {r.conversationId && (
                  <Link
                    href={`/dashboard/inbox/${r.conversationId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    aria-label={`Abrir chat con ${r.firstName}`}
                  >
                    <MessageCircle className="size-4" />
                  </Link>
                )}
              </li>
            )
          })}
          {visible.length > limit && (
            <li className="p-3 text-center">
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="rounded-xl bg-muted px-4 py-2 text-xs font-medium hover:bg-accent"
              >
                Mostrar más ({visible.length - limit} restantes)
              </button>
            </li>
          )}
        </ul>
      </div>

      <div className="border-t border-border/60 bg-card p-3 sm:px-4">
        {confirmBulkDelete ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmBulkDelete(false)}
              className="rounded-xl bg-muted px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => removeClients(selectedList.map((r) => r.clientId))}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white hover:bg-destructive/85"
            >
              <Trash2 className="size-4" />
              ¿Borrar {selectedList.length} de la base de datos? Confirmar
            </button>
          </div>
        ) : confirming ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-xl bg-muted px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={send}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white hover:bg-destructive/85"
            >
              <Send className="size-4" />
              ¿Enviar a {selectedList.length}? Confirmar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmBulkDelete(true)}
            disabled={selectedList.length === 0 || pending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            {busy === 'delete' ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Borrar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!approved || selectedList.length === 0 || pending}
            title={!approved ? 'Meta todavía no aprueba la plantilla' : undefined}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
          >
            {busy === 'send' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {!approved
              ? 'Esperando aprobación de Meta'
              : selectedList.length === 0
                ? 'Elige a quién enviar'
                : `Enviar a ${selectedList.length} · ~$${(selectedList.length * COST_PER_MESSAGE).toLocaleString('es-CO')}`}
          </button>
          </div>
        )}
      </div>
    </div>
  )
}
