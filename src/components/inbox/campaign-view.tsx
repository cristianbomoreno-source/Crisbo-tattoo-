'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  CheckSquare,
  Copy,
  Gift,
  Loader2,
  Megaphone,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Ticket,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CAMPAIGN_GROUPS, timeAwayLabel, type CampaignGroup } from '@/lib/campaigns/audience'
import { CAMPAIGN_IMAGE_PATH, CAMPAIGN_NAME, CAMPAIGN_SLOTS, CAMPAIGN_TEMPLATES } from '@/lib/campaigns/nuevos-trazos'
import type { CampaignRecipient } from '@/queries/campaigns'
import {
  getCampaignTemplateStatuses,
  sendCampaignGroup,
  sendCampaignToClients,
  setCampaignAdded,
  setCampaignExcluded,
  setCampaignSlot,
  setupCampaignTemplates,
  type CampaignTemplateStatus,
} from '@/actions/campaigns'
import { deleteClientsAction, searchClientsAction } from '@/actions/clients'

type Tab = 'todos' | CampaignGroup | 'quitados'

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

/** Cuántas filas se pintan de una ("Todos" trae a todos los contactos). */
const PAGE = 200

/** Campaña "Nuevos Trazos": plantillas, envío por grupo y lista de clientes. */
export function CampaignView({
  recipients: initialRecipients,
  error,
  isOwner,
  templates: initialTemplates,
  slotsTaken: initialSlotsTaken,
}: {
  recipients: CampaignRecipient[]
  slotsTaken: number
  error: string | null
  isOwner: boolean
  templates: CampaignTemplateStatus[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('todos')
  const [query, setQuery] = useState('')
  const [templates, setTemplates] = useState(initialTemplates)
  const [confirming, setConfirming] = useState<CampaignGroup | null>(null)
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  // Quitar/devolver se refleja al instante; si falla, se revierte.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [slotOverrides, setSlotOverrides] = useState<Record<string, boolean>>({})
  const [slotsTaken, setSlotsTaken] = useState(initialSlotsTaken)
  // Modo "Elegir a quién enviar": marcar clientes de la lista (y agregar
  // contactos que no estaban) para mandarles la campaña solo a ellos.
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmSelected, setConfirmSelected] = useState(false)
  const [others, setOthers] = useState<{ id: string; name: string; phone: string | null }[]>([])
  const [limit, setLimit] = useState(PAGE)
  // Borrado de la base: la X borra directo y la fila se esconde al instante.
  const [deleted, setDeleted] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const recipients = useMemo(
    () =>
      initialRecipients.filter((r) => !deleted.has(r.clientId)).map((r) => ({
        ...r,
        excluded: r.clientId in overrides ? overrides[r.clientId] === true : r.excluded,
        slotTaken: r.clientId in slotOverrides ? slotOverrides[r.clientId] === true : r.slotTaken,
      })),
    [initialRecipients, overrides, slotOverrides, deleted]
  )
  const slotsLeft = CAMPAIGN_SLOTS - slotsTaken
  const active = recipients.filter((r) => !r.excluded)
  const removed = recipients.filter((r) => r.excluded)

  const inCampaign = active.filter((r) => r.group).length
  const counts = {
    todos: active.length,
    A: active.filter((r) => r.group === 'A').length,
    B: active.filter((r) => r.group === 'B').length,
    quitados: removed.length,
  }
  const sentCount = recipients.filter((r) => r.sentStatus).length
  const yesCount = recipients.filter((r) => r.reply === 'yes').length
  const noCount = recipients.filter((r) => r.reply === 'no').length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipients.filter(
      (r) =>
        (tab === 'quitados' ? r.excluded : !r.excluded && (tab === 'todos' || r.group === tab)) &&
        (!q || r.name.toLowerCase().includes(q) || r.phone.includes(q))
    )
  }, [recipients, tab, query])

  /** Se puede elegir: no quitado y sin la campaña ya entregada (los fallidos sí). */
  const selectable = (r: CampaignRecipient) => !r.excluded && (!r.sentStatus || r.sentStatus === 'failed')
  const selectedList = recipients.filter((r) => selected.has(r.clientId) && selectable(r))
  const visibleSelectable = visible.filter(selectable)
  const allVisibleOn = visibleSelectable.length > 0 && visibleSelectable.every((r) => selected.has(r.clientId))
  const inListIds = useMemo(() => new Set(recipients.map((r) => r.clientId)), [recipients])

  function toggleSelected(id: string) {
    setConfirmSelected(false)
    setConfirmBulkDelete(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    setConfirmSelected(false)
    setConfirmBulkDelete(false)
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of visibleSelectable) {
        if (allVisibleOn) next.delete(r.clientId)
        else next.add(r.clientId)
      }
      return next
    })
  }

  // Mientras se elige, la búsqueda también mira TODOS los contactos.
  useEffect(() => {
    const q = query.trim()
    if (!selecting || q.length < 2) return
    const t = setTimeout(async () => {
      const res = await searchClientsAction(q)
      setOthers(res.success ? res.data.filter((c) => c.phone && !inListIds.has(c.id)) : [])
    }, 300)
    return () => clearTimeout(t)
  }, [query, selecting, inListIds])
  const shownOthers = selecting && query.trim().length >= 2 ? others : []

  function addContact(c: { id: string; name: string }) {
    startTransition(async () => {
      const res = await setCampaignAdded(c.id, true)
      if (!res.success) return void toast.error(res.error.message)
      setSelected((prev) => new Set(prev).add(c.id))
      setOthers((o) => o.filter((x) => x.id !== c.id))
      toast.success(`${c.name} agregado y seleccionado`)
      router.refresh()
    })
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
      // Sin router.refresh: cada recarga consultaba a Meta y bloqueó la cuenta (#80008).
      setSelected((prev) => new Set([...prev].filter((id) => !gone.includes(id))))
    })
  }

  function sendSelected() {
    const ids = selectedList.map((r) => r.clientId)
    setConfirmSelected(false)
    setBusy('send-selected')
    startTransition(async () => {
      const res = await sendCampaignToClients(ids)
      setBusy(null)
      if (!res.success) return void toast.error(res.error.message)
      const { sent, failed } = res.data
      if (sent) toast.success(`${sent} mensajes enviados`)
      if (failed.length) {
        toast.error(`${failed.length} no se enviaron: ${failed.slice(0, 3).map((f) => `${f.name} (${f.error})`).join(', ')}`)
      }
      if (!sent && !failed.length) toast.info('Ninguno de los elegidos estaba pendiente')
      setSelected(new Set())
      setSelecting(false)
      router.refresh()
    })
  }

  function toggleSelecting() {
    setSelecting((v) => !v)
    setSelected(new Set())
    setConfirmSelected(false)
    setConfirmBulkDelete(false)
    if (tab === 'quitados') setTab('todos')
  }

  const statusOf = (key: CampaignGroup) => templates.find((t) => t.key === key)?.status ?? 'MISSING'
  const anyMissing = templates.length === 0 || templates.some((t) => t.status === 'MISSING')

  async function copyList() {
    const text = visible.map((r) => `${r.firstName}\t${r.phone}\t${r.group ? CAMPAIGN_GROUPS[r.group].label : 'Sin grupo'}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${visible.length} clientes copiados`)
    } catch {
      toast.error('No se pudo copiar la lista')
    }
  }

  function createTemplates() {
    setBusy('setup')
    startTransition(async () => {
      const res = await setupCampaignTemplates()
      setBusy(null)
      if (!res.success) return void toast.error(res.error.message)
      setTemplates(res.data)
      toast.success('Plantillas enviadas a revisión de Meta')
    })
  }

  function refreshTemplates() {
    setBusy('refresh')
    startTransition(async () => {
      const res = await getCampaignTemplateStatuses(true)
      setBusy(null)
      if (!res.success) return void toast.error(res.error.message)
      setTemplates(res.data)
    })
  }

  async function toggleExcluded(r: CampaignRecipient, excluded: boolean) {
    setOverrides((o) => ({ ...o, [r.clientId]: excluded }))
    const res = await setCampaignExcluded(r.clientId, excluded)
    if (!res.success) {
      setOverrides((o) => ({ ...o, [r.clientId]: !excluded }))
      return void toast.error(res.error.message)
    }
    toast.success(excluded ? `${r.firstName} salió de la lista` : `${r.firstName} volvió a la lista`)
  }

  function toggleSlot(r: CampaignRecipient) {
    startTransition(async () => {
      const res = await setCampaignSlot(r.clientId, !r.slotTaken)
      if (!res.success) return void toast.error(res.error.message)
      setSlotOverrides((o) => ({ ...o, [r.clientId]: !r.slotTaken }))
      setSlotsTaken(res.data.slotsTaken)
      toast.success(
        !r.slotTaken
          ? `Cupo de ${r.firstName} · quedan ${CAMPAIGN_SLOTS - res.data.slotsTaken}`
          : `Cupo de ${r.firstName} liberado`
      )
    })
  }

  function send(group: CampaignGroup) {
    setConfirming(null)
    setBusy(`send-${group}`)
    startTransition(async () => {
      const res = await sendCampaignGroup(group)
      setBusy(null)
      if (!res.success) return void toast.error(res.error.message)
      const { sent, failed } = res.data
      if (sent) toast.success(`${CAMPAIGN_GROUPS[group].label}: ${sent} mensajes enviados`)
      if (failed.length) {
        toast.error(`${failed.length} no se enviaron: ${failed.slice(0, 3).map((f) => `${f.name} (${f.error})`).join(', ')}`)
      }
      if (!sent && !failed.length) toast.info('Todos los del grupo ya recibieron el mensaje')
      router.refresh()
    })
  }

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link
          href="/dashboard/inbox/campaigns/nuevos-trazos"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60"
          aria-label="Volver a las estadísticas"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-sm font-semibold">Campaña “{CAMPAIGN_NAME}”</h2>
          <p className="truncate text-xs text-muted-foreground">
            {inCampaign} en campaña · {counts.todos} contactos · {sentCount} enviados · {yesCount} quieren cupo · {noCount} no
          </p>
        </div>
        <button
          type="button"
          onClick={copyList}
          disabled={visible.length === 0}
          className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          <Copy className="size-3.5" />
          Copiar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 border-b border-border/60 p-3 sm:px-4">
          <div className="rounded-xl border border-border/60 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <Ticket className="size-3.5 text-primary" />
                Cupos
              </p>
              <p className="text-xs text-muted-foreground">
                {slotsLeft > 0 ? (
                  <>
                    <span className="font-display text-lg font-semibold text-foreground">{slotsLeft}</span> disponibles
                  </>
                ) : (
                  <span className="font-semibold text-destructive">Agotados</span>
                )}
              </p>
            </div>
            <div className="mt-2 flex gap-1" aria-label={`${slotsTaken} de ${CAMPAIGN_SLOTS} cupos tomados`}>
              {Array.from({ length: CAMPAIGN_SLOTS }, (_, i) => (
                <span key={i} className={cn('h-2 flex-1 rounded-full', i < slotsTaken ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {slotsTaken} de {CAMPAIGN_SLOTS} tomados · márcalos cuando el cliente pague el abono de $92.000
            </p>
          </div>
          <div className="overflow-hidden rounded-xl bg-primary/10 text-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CAMPAIGN_IMAGE_PATH} alt={CAMPAIGN_NAME} className="aspect-[1200/628] w-full object-cover" />
            <p className="flex gap-2 p-3 text-muted-foreground">
              <Gift className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="font-semibold text-foreground">Tatuaje hasta 20 cm en blanco y negro por $460.000</span>{' '}
                + un tatuaje minimalista de regalo. Solo {CAMPAIGN_SLOTS} cupos, hasta el 3 de noviembre. No incluye clientes con cita
                agendada ni que se tatuaron en el último mes.
              </span>
            </p>
          </div>

          {isOwner && (
            <div className="space-y-2 rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">Plantillas en Meta</p>
                {!anyMissing && (
                  <button
                    type="button"
                    onClick={refreshTemplates}
                    disabled={pending}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/60"
                  >
                    <RefreshCw className={cn('size-3', busy === 'refresh' && 'animate-spin')} />
                    Actualizar
                  </button>
                )}
              </div>
              <ul className="space-y-1">
                {(Object.keys(CAMPAIGN_TEMPLATES) as (keyof typeof CAMPAIGN_TEMPLATES)[]).map((key) => {
                  const t = templates.find((x) => x.key === key)
                  const st = TEMPLATE_STATUS[t?.status ?? 'MISSING'] ?? { label: t?.status, className: 'bg-muted' }
                  return (
                    <li key={key} className="flex items-center justify-between gap-2 text-xs">
                      <span>{CAMPAIGN_TEMPLATES[key].label}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', st.className)}>
                        {st.label}
                      </span>
                      {t?.reason && <span className="w-full text-[11px] text-destructive">{t.reason}</span>}
                    </li>
                  )
                })}
              </ul>
              {anyMissing && (
                <button
                  type="button"
                  onClick={createTemplates}
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
                >
                  {busy === 'setup' && <Loader2 className="size-3.5 animate-spin" />}
                  Crear plantillas en Meta
                </button>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {(['A', 'B'] as const).map((g) => {
                  const remaining = active.filter((r) => r.group === g && !r.sentStatus).length
                  const approved = statusOf(g) === 'APPROVED'
                  return confirming === g ? (
                    <button
                      key={g}
                      type="button"
                      onClick={() => send(g)}
                      className="rounded-xl bg-destructive py-2 text-xs font-semibold text-white hover:bg-destructive/85"
                    >
                      ¿Enviar a {remaining}? Confirmar
                    </button>
                  ) : (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setConfirming(g)}
                      disabled={!approved || remaining === 0 || pending}
                      title={!approved ? 'Meta todavía no aprueba la plantilla' : undefined}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-muted py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
                    >
                      {busy === `send-${g}` ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                      {remaining === 0 ? `${CAMPAIGN_GROUPS[g].label} enviado` : `Enviar ${CAMPAIGN_GROUPS[g].label} (${remaining})`}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={toggleSelecting}
                disabled={statusOf('A') !== 'APPROVED'}
                className={cn(
                  'flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold disabled:opacity-50',
                  selecting ? 'bg-muted hover:bg-accent' : 'bg-primary text-primary-foreground hover:bg-primary/85'
                )}
              >
                {selecting ? <X className="size-3.5" /> : <CheckSquare className="size-3.5" />}
                {selecting ? 'Cancelar selección' : 'Elegir a quién enviar'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
            {(['todos', 'A', 'B', 'quitados'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key)
                  setLimit(PAGE)
                }}
                aria-pressed={tab === key}
                title={key === 'A' || key === 'B' ? CAMPAIGN_GROUPS[key].hint : undefined}
                className={cn(
                  'rounded-lg py-1.5 text-xs font-medium transition-colors',
                  tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {key === 'todos' ? 'Todos' : key === 'quitados' ? 'Quitados' : CAMPAIGN_GROUPS[key].label} ({counts[key]})
              </button>
            ))}
          </div>
          {tab === 'todos' && isOwner && (
            <p className="text-xs text-muted-foreground">
              Todos tus contactos con teléfono. La X borra al cliente de la base de datos.
            </p>
          )}
          {(tab === 'A' || tab === 'B') && <p className="text-xs text-muted-foreground">{CAMPAIGN_GROUPS[tab].hint}</p>}
          {tab === 'quitados' && (
            <p className="text-xs text-muted-foreground">No reciben la campaña. Toca ↩ para devolver a alguien a la lista.</p>
          )}
          <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimit(PAGE)
              }}
              placeholder={selecting ? 'Buscar en la lista o en todos tus contactos' : 'Buscar cliente o número'}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          {selecting && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                Toca a cada cliente para marcarlo. A quien ya le llegó no se le vuelve a enviar.
              </span>
              <button
                type="button"
                onClick={toggleAllVisible}
                disabled={visibleSelectable.length === 0}
                className="shrink-0 rounded-md px-2 py-1 font-semibold text-primary hover:bg-accent/60 disabled:opacity-40"
              >
                {allVisibleOn ? 'Desmarcar todos' : `Marcar todos (${visibleSelectable.length})`}
              </button>
            </div>
          )}
        </div>

        {shownOthers.length > 0 && (
          <div className="border-b border-border/60 px-3 py-2 sm:px-4">
            <p className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Otros contactos
            </p>
            <ul className="divide-y divide-border/60">
              {shownOthers.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addContact(c)}
                    disabled={pending}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25 disabled:opacity-50"
                  >
                    <Plus className="size-3.5" />
                    Agregar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="divide-y divide-border/60">
          {error && <li className="p-6 text-center text-sm text-destructive">No se pudo cargar la lista: {error}</li>}
          {!error && visible.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">No hay clientes en esta lista.</li>
          )}
          {visible.slice(0, limit).map((r) => {
            const sent = r.sentStatus ? SEND_STATUS[r.sentStatus] ?? SEND_STATUS.sent : null
            const canPick = selecting && selectable(r)
            const picked = canPick && selected.has(r.clientId)
            return (
              <li
                key={r.clientId}
                onClick={canPick ? () => toggleSelected(r.clientId) : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 sm:px-4',
                  canPick && 'cursor-pointer hover:bg-accent/40',
                  picked && 'bg-primary/10',
                  selecting && !canPick && 'opacity-50'
                )}
              >
                {selecting ? (
                  <span
                    role="checkbox"
                    aria-checked={picked}
                    aria-label={`Elegir a ${r.firstName}`}
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors',
                      picked ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'
                    )}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                    {r.firstName.charAt(0)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.firstName}
                    <span className="ml-1.5 font-normal text-muted-foreground">{r.name}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.phone} ·{' '}
                    {r.lastVisit ? `última visita ${timeAwayLabel(r.lastVisit)}` : r.added ? 'agregado a mano' : 'sin visitas'}
                  </p>
                  {(sent || r.reply || r.slotTaken || r.wroteBack || r.reminded || r.added) && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {r.added && (
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
                          Agregado
                        </span>
                      )}
                      {sent && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', sent.className)}>
                          {sent.label}
                        </span>
                      )}
                      {r.slotTaken && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          Cupo tomado
                        </span>
                      )}
                      {r.reply === 'yes' && (
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Quiere cupo
                        </span>
                      )}
                      {r.wroteBack && !r.reply && (
                        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                          Escribió
                        </span>
                      )}
                      {r.reminded && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          Recordatorio
                        </span>
                      )}
                      {r.reply === 'no' && (
                        <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          No le interesa
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {r.group && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      r.group === 'A' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {r.group}
                  </span>
                )}
                {isOwner && !r.excluded && (r.sentStatus || r.slotTaken) && (
                  <button
                    type="button"
                    onClick={() => toggleSlot(r)}
                    disabled={pending || (!r.slotTaken && slotsLeft <= 0)}
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full disabled:opacity-40',
                      r.slotTaken ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    )}
                    aria-label={r.slotTaken ? `Liberar cupo de ${r.firstName}` : `Marcar cupo tomado por ${r.firstName}`}
                    title={r.slotTaken ? 'Liberar cupo' : 'Marcar cupo tomado (pagó el abono)'}
                  >
                    <Ticket className="size-4" />
                  </button>
                )}
                {!selecting && isOwner && r.excluded && (
                  <button
                    type="button"
                    onClick={() => toggleExcluded(r, false)}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    aria-label={`Devolver a ${r.firstName} a la lista`}
                    title="Devolver a la lista"
                  >
                    <Undo2 className="size-4" />
                  </button>
                )}
                {!selecting && isOwner && !r.excluded && !r.slotTaken && (
                  <button
                    type="button"
                    onClick={() => removeClients([r.clientId])}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Borrar a ${r.firstName} de la base de datos`}
                    title="Borrar de la base de datos"
                  >
                    <X className="size-4" />
                  </button>
                )}
                {r.conversationId ? (
                  <Link
                    href={`/dashboard/inbox/${r.conversationId}`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    aria-label={`Abrir chat con ${r.firstName}`}
                  >
                    <MessageCircle className="size-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/clients/${r.clientId}`}
                    className="shrink-0 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  >
                    Ficha
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

      {selecting && (
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
          ) : confirmSelected ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmSelected(false)}
                className="rounded-xl bg-muted px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={sendSelected}
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
              onClick={() => setConfirmSelected(true)}
              disabled={selectedList.length === 0 || pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
            >
              {busy === 'send-selected' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {selectedList.length === 0 ? 'Elige a quién enviar' : `Enviar a ${selectedList.length} seleccionados`}
            </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
