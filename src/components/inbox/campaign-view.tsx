'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Gift, Loader2, Megaphone, MessageCircle, RefreshCw, Search, Send, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CAMPAIGN_GROUPS, timeAwayLabel, type CampaignGroup } from '@/lib/campaigns/audience'
import { CAMPAIGN_IMAGE_PATH, CAMPAIGN_NAME, CAMPAIGN_TEMPLATES } from '@/lib/campaigns/nuevos-trazos'
import type { CampaignRecipient } from '@/queries/campaigns'
import {
  getCampaignTemplateStatuses,
  sendCampaignGroup,
  setCampaignExcluded,
  setupCampaignTemplates,
  type CampaignTemplateStatus,
} from '@/actions/campaigns'

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

/** Campaña "Nuevos Trazos": plantillas, envío por grupo y lista de clientes. */
export function CampaignView({
  recipients: initialRecipients,
  error,
  isOwner,
  templates: initialTemplates,
}: {
  recipients: CampaignRecipient[]
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
  const recipients = useMemo(
    () => initialRecipients.map((r) => (r.clientId in overrides ? { ...r, excluded: overrides[r.clientId] === true } : r)),
    [initialRecipients, overrides]
  )
  const active = recipients.filter((r) => !r.excluded)
  const removed = recipients.filter((r) => r.excluded)

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

  const statusOf = (key: CampaignGroup) => templates.find((t) => t.key === key)?.status ?? 'MISSING'
  const anyMissing = templates.length === 0 || templates.some((t) => t.status === 'MISSING')

  async function copyList() {
    const text = visible.map((r) => `${r.firstName}\t${r.phone}\t${CAMPAIGN_GROUPS[r.group].label}`).join('\n')
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
      const res = await getCampaignTemplateStatuses()
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
          href="/dashboard/inbox"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 lg:hidden"
          aria-label="Volver a los chats"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-sm font-semibold">Campaña “{CAMPAIGN_NAME}”</h2>
          <p className="truncate text-xs text-muted-foreground">
            {counts.todos} clientes · {sentCount} enviados · {yesCount} quieren cupo · {noCount} no
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
          <div className="overflow-hidden rounded-xl bg-primary/10 text-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CAMPAIGN_IMAGE_PATH} alt={CAMPAIGN_NAME} className="aspect-[1200/628] w-full object-cover" />
            <p className="flex gap-2 p-3 text-muted-foreground">
              <Gift className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="font-semibold text-foreground">Tatuaje hasta 20 cm en blanco y negro por $460.000</span>{' '}
                + un tatuaje minimalista de regalo. Solo 15 cupos, hasta el 3 de noviembre. No incluye clientes con cita
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
            </div>
          )}

          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
            {(['todos', 'A', 'B', 'quitados'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
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
          {(tab === 'A' || tab === 'B') && <p className="text-xs text-muted-foreground">{CAMPAIGN_GROUPS[tab].hint}</p>}
          {tab === 'quitados' && (
            <p className="text-xs text-muted-foreground">No reciben la campaña. Toca ↩ para devolver a alguien a la lista.</p>
          )}
          <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente o número"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <ul className="divide-y divide-border/60">
          {error && <li className="p-6 text-center text-sm text-destructive">No se pudo cargar la lista: {error}</li>}
          {!error && visible.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">No hay clientes en esta lista.</li>
          )}
          {visible.map((r) => {
            const sent = r.sentStatus ? SEND_STATUS[r.sentStatus] ?? SEND_STATUS.sent : null
            return (
              <li key={r.clientId} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {r.firstName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.firstName}
                    <span className="ml-1.5 font-normal text-muted-foreground">{r.name}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.phone} · última visita {timeAwayLabel(r.lastVisit)}
                  </p>
                  {(sent || r.reply) && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {sent && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', sent.className)}>
                          {sent.label}
                        </span>
                      )}
                      {r.reply === 'yes' && (
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Quiere cupo
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
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    r.group === 'A' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {r.group}
                </span>
                {isOwner && !r.sentStatus && (
                  <button
                    type="button"
                    onClick={() => toggleExcluded(r, !r.excluded)}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    aria-label={r.excluded ? `Devolver a ${r.firstName} a la lista` : `Quitar a ${r.firstName} de la lista`}
                    title={r.excluded ? 'Devolver a la lista' : 'Quitar de la lista'}
                  >
                    {r.excluded ? <Undo2 className="size-4" /> : <X className="size-4" />}
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
        </ul>
      </div>
    </div>
  )
}
