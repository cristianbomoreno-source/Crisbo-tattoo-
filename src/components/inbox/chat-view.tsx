'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Bandage,
  Banknote,
  CalendarPlus,
  Check,
  CheckCheck,
  IdCard,
  ListChecks,
  ClipboardList,
  Clock,
  FileText,
  Link2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Send,
  Sparkles,
  UserPlus,
  UserRound,
  Wallet,
  Flame,
  X,
  type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { isServiceWindowOpen } from '@/lib/whatsapp-cloud/parse'
import { chatChannel } from '@/lib/instagram/channel'
import { InstagramIcon } from '@/components/shared/instagram-icon'
import {
  markConversationRead,
  sendBookingConfirmationToChat,
  sendChatShortcut,
  sendDataForm,
  sendStudioLocation,
  sendWhatsAppMessage,
  setConversationArchived,
} from '@/actions/whatsapp'
import type { WaConversation, WaMessage } from '@/queries/whatsapp'
import { Button } from '@/components/ui/button'
import { HomeCalendarDialog } from '@/components/home/home-calendar-dialog'
import { todayKey } from '@/lib/calendar/utils'
import { CHAT_SHORTCUTS, suggestReplies } from '@/lib/whatsapp-cloud/chat-shortcuts'
import { buildReplyDraft } from '@/lib/whatsapp-cloud/reply-draft'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientLinkDialog } from './client-link-dialog'
import { LeadBar } from './lead-bar'
import { ClientCrmSheet } from './client-crm-sheet'
import { leadStageInfo } from '@/lib/whatsapp-cloud/lead'
import { CampaignSlotBar } from './campaign-slot-bar'
import type { CampaignChatInfo } from '@/queries/campaigns'
import {
  chatInitials,
  chatName,
  formatDayLabel,
  formatMessageTime,
  formatWaPhone,
  formatWindowRemaining,
  sameDay,
} from './format'

/** Ícono de cada botón de mensaje fijo (`chat-shortcuts.ts`). */
const SHORTCUT_ICONS: Record<string, LucideIcon> = {
  promo: Flame,
  abono: Wallet,
  comprobante: Banknote,
  recomendaciones: ListChecks,
  horario: Clock,
  menores: IdCard,
  cuidados: Bandage,
}

type ClientOption = { id: string; name: string; phone: string | null }

export function ChatView({
  conversation,
  initialMessages,
  clients,
  formTemplateStatus,
  campaign,
}: {
  conversation: WaConversation
  initialMessages: WaMessage[]
  clients: ClientOption[]
  /** Estado en Meta de la plantilla del formulario de datos (null = no creada). */
  formTemplateStatus: string | null
  /** Barra de cupos si al chat le llegó la campaña. */
  campaign?: CampaignChatInfo | null
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [lastInboundAt, setLastInboundAt] = useState(conversation.last_inbound_at)
  const [linkOpen, setLinkOpen] = useState(false)
  const [crmOpen, setCrmOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [sending, startSending] = useTransition()
  const [archiving, startArchiving] = useTransition()
  const [sendingForm, startSendingForm] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const name = chatName(conversation)
  const instagram = chatChannel(conversation) === 'instagram'
  // El formulario de datos es un WhatsApp Flow: no existe en Instagram.
  const formAvailable = formTemplateStatus && !instagram
  const windowOpen = isServiceWindowOpen(lastInboundAt)
  const remaining = lastInboundAt ? formatWindowRemaining(lastInboundAt) : null
  const client = conversation.client

  // Mensajes nuevos y cambios de estado (✓ → ✓✓ → azul) en vivo.
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    const channel = supabase.channel(`wa-messages-${conversation.id}`)

    supabase.realtime.setAuth().then(() => {
      if (cancelled) return
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'wa_messages', filter: `conversation_id=eq.${conversation.id}` },
          (payload) => {
            const m = payload.new as WaMessage
            setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]))
            if (m.direction === 'in') {
              setLastInboundAt(m.created_at)
              markConversationRead(conversation.id)
              // El webhook acaba de crear/vincular el cliente con sus datos.
              if (m.type === 'form') router.refresh()
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'wa_messages', filter: `conversation_id=eq.${conversation.id}` },
          (payload) => {
            const m = payload.new as WaMessage
            setMessages((prev) => prev.map((p) => (p.id === m.id ? { ...p, ...m } : p)))
          }
        )
        .subscribe()
    })

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [conversation.id, router])

  // Al abrir: contador a 0 (la lista se actualiza sola por Realtime).
  useEffect(() => {
    if (conversation.unread_count > 0) markConversationRead(conversation.id)
  }, [conversation.id, conversation.unread_count])

  // Siempre abajo del todo al abrir y con cada mensaje nuevo.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  function send() {
    const body = draft.trim()
    if (!body || sending) return
    startSending(async () => {
      const result = await sendWhatsAppMessage({ conversationId: conversation.id, body })
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setDraft('')
      setMessages((prev) => (prev.some((p) => p.id === result.data.id) ? prev : [...prev, result.data]))
      textareaRef.current?.focus()
    })
  }

  function sendLocation() {
    if (sending) return
    startSending(async () => {
      const result = await sendStudioLocation(conversation.id)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setMessages((prev) => (prev.some((p) => p.id === result.data.id) ? prev : [...prev, result.data]))
    })
  }

  /** Botones de mensajes fijos: se envían tal cual, sin pasar por el borrador. */
  function sendShortcut(key: string) {
    if (sending) return
    startSending(async () => {
      const result = await sendChatShortcut(conversation.id, key)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      setMessages((prev) => (prev.some((p) => p.id === result.data.id) ? prev : [...prev, result.data]))
    })
  }

  function sendForm() {
    startSendingForm(async () => {
      const result = await sendDataForm(conversation.id)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success('Formulario enviado')
      setMessages((prev) => (prev.some((p) => p.id === result.data.id) ? prev : [...prev, result.data]))
    })
  }

  const formButton = formAvailable ? (
    <Button size="sm" variant="outline" onClick={sendForm} disabled={sendingForm}>
      <ClipboardList />
      {sendingForm ? 'Enviando…' : 'Enviar formulario'}
    </Button>
  ) : null

  // Lo que el cliente escribió desde nuestra última respuesta: de ahí salen
  // las palabras clave que resaltan el botón más adecuado.
  const pendingClientText = useMemo(() => {
    const lastOut = messages.findLastIndex((m) => m.direction === 'out')
    return messages
      .slice(lastOut + 1)
      .filter((m) => m.direction === 'in' && m.body)
      .map((m) => m.body)
      .join('\n')
  }, [messages])
  const suggestions = useMemo(() => suggestReplies(pendingClientText), [pendingClientText])
  // Respuesta sugerida escrita (sin IA): se descarta hasta el próximo mensaje del cliente.
  const replyDraft = useMemo(
    () => buildReplyDraft(messages, { clientName: client?.name ?? conversation.contact_name }),
    [messages, client?.name, conversation.contact_name]
  )
  const lastMessageId = messages.at(-1)?.id ?? null
  const [dismissedDraftFor, setDismissedDraftFor] = useState<string | null>(null)
  const showReplyDraft = !!replyDraft && dismissedDraftFor !== lastMessageId && !draft.trim()
  const suggested = new Set<string>(suggestions)

  const actions: { key: string; label: string; Icon: LucideIcon; onClick: () => void; disabled: boolean }[] = [
    { key: 'ubicacion', label: 'Ubicación', Icon: MapPin, onClick: sendLocation, disabled: sending },
    ...CHAT_SHORTCUTS.map((s) => ({
      key: s.key,
      label: s.label,
      Icon: SHORTCUT_ICONS[s.key] ?? Send,
      onClick: () => sendShortcut(s.key),
      disabled: sending,
    })),
    ...(formAvailable
      ? [{ key: 'formulario', label: sendingForm ? 'Enviando…' : 'Enviar formulario', Icon: ClipboardList, onClick: sendForm, disabled: sendingForm }]
      : []),
  ]
  // Las sugeridas primero, en orden de relevancia; el resto como siempre.
  const rank = (key: string) => (suggested.has(key) ? suggestions.indexOf(key) : suggestions.length)
  actions.sort((a, b) => rank(a.key) - rank(b.key))

  /** Cita creada desde el chat: la confirmación sale por este mismo chat. */
  async function confirmBooking(sessionId: string) {
    const result = await sendBookingConfirmationToChat(conversation.id, sessionId)
    router.refresh()
    if (!result.success) {
      toast.error(`Cita agendada, pero no se envió la confirmación: ${result.error.message}`)
      return
    }
    setMessages((prev) => (prev.some((p) => p.id === result.data.id) ? prev : [...prev, result.data]))
  }

  function toggleArchive() {
    startArchiving(async () => {
      const result = await setConversationArchived(conversation.id, !conversation.archived)
      if (!result.success) {
        toast.error(result.error.message)
        return
      }
      toast.success(conversation.archived ? 'Chat movido a la bandeja' : 'Chat archivado')
      if (!conversation.archived) router.push('/dashboard/inbox')
      else router.refresh()
    })
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header: contacto + acciones principales. */}
      <header className="flex items-center gap-2 px-3 pt-2 pb-1 sm:gap-3 sm:px-4 sm:pt-3">
        <Link
          href="/dashboard/inbox"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary transition-transform duration-150 ease-out active:scale-[0.94] lg:hidden"
          aria-label="Volver a los chats"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() => (client ? setCrmOpen(true) : setLinkOpen(true))}
          aria-label={client ? 'Ver ficha del cliente' : 'Guardar como cliente'}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left active:opacity-70 sm:gap-3"
        >
        <span className="relative shrink-0">
          <span className={cn('grid size-11 place-items-center rounded-full text-[15px] font-bold text-white', leadStageInfo(conversation.lead_stage).tile)}>
            {chatInitials(name.replace(/^@/, ''))}
          </span>
          <span
            aria-hidden
            className={cn(
              'absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card',
              windowOpen ? 'bg-income' : 'bg-muted-foreground/50'
            )}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.0625rem] leading-tight font-semibold">{name}</p>
          <p suppressHydrationWarning className="mt-0.5 flex items-center truncate text-xs text-muted-foreground">
            {instagram ? (
              <InstagramIcon className="mr-1 size-3 shrink-0 text-pink-500" />
            ) : (
              <MessageCircle className="mr-1 size-3 shrink-0 text-income" />
            )}
            {instagram
              ? conversation.ig_username
                ? `@${conversation.ig_username}`
                : 'Instagram'
              : formatWaPhone(conversation.wa_id)}
            <span className="mx-1.5 opacity-50">·</span>
            {windowOpen && remaining ? (
              <span className="text-income">Responde libre · {remaining}</span>
            ) : (
              <span>{instagram ? 'Ventana cerrada' : 'Solo plantillas'}</span>
            )}
          </p>
        </div>
        </button>
        <Button size="sm" onClick={() => setScheduleOpen(true)} className="shrink-0">
          <CalendarPlus />
          <span className="hidden sm:inline">Agendar cita</span>
        </Button>
        {client ? (
          <Button size="sm" variant="secondary" onClick={() => setCrmOpen(true)} className="shrink-0">
            <UserRound />
            <span className="hidden sm:inline">Ficha</span>
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)} className="shrink-0">
            <UserPlus />
            <span className="hidden sm:inline">Guardar cliente</span>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Más opciones"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-foreground"
          >
            <MoreVertical className="size-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {client && (
              <DropdownMenuItem onClick={() => setCrmOpen(true)}>
                <UserRound />
                Ver ficha del cliente
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setLinkOpen(true)}>
              <Link2 />
              {client ? 'Cambiar cliente vinculado' : 'Vincular a un cliente'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleArchive} disabled={archiving}>
              {conversation.archived ? <ArchiveRestore /> : <Archive />}
              {conversation.archived ? 'Mover a la bandeja' : 'Archivar chat'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Seguimiento del lead: etapa del embudo + recordatorio. */}
      <LeadBar
        conversationId={conversation.id}
        clientId={conversation.client_id}
        stage={conversation.lead_stage}
        followUpAt={conversation.follow_up_at}
      />
      {client && <ClientCrmSheet clientId={client.id} channel={instagram ? 'instagram' : 'whatsapp'} open={crmOpen} onOpenChange={setCrmOpen} />}
      {campaign && <CampaignSlotBar info={campaign} />}

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const showDay = !prev || !sameDay(prev.created_at, m.created_at)
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="px-3 py-1 text-[13px] font-semibold capitalize text-muted-foreground">
                    {formatDayLabel(m.created_at)}
                  </span>
                </div>
              )}
              <MessageBubble message={m} />
            </div>
          )
        })}
      </div>

      {/* Composer */}
      <footer className="px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 lg:pb-3">
        {windowOpen ? (
          <>
            {showReplyDraft && (
              <div className="mb-2 rounded-[1.25rem] bg-primary/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1 text-[12px] font-semibold text-primary">
                    <Sparkles className="size-3" />
                    Respuesta sugerida
                  </p>
                  <button
                    type="button"
                    onClick={() => setDismissedDraftFor(lastMessageId)}
                    className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-accent/60"
                    aria-label="Descartar sugerencia"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-line text-sm">{replyDraft}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDraft(replyDraft!)
                      textareaRef.current?.focus()
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    disabled={sending}
                    onClick={() => {
                      if (sending) return
                      startSending(async () => {
                        const result = await sendWhatsAppMessage({ conversationId: conversation.id, body: replyDraft! })
                        if (!result.success) return void toast.error(result.error.message)
                        setMessages((prev) => (prev.some((p) => p.id === result.data.id) ? prev : [...prev, result.data]))
                      })
                    }}
                  >
                    <Send />
                    Enviar así
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter envía; Shift+Enter = salto de línea (como WhatsApp Web).
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    send()
                  }
                }}
                rows={1}
                placeholder="Escribe un mensaje"
                className="max-h-40 min-h-11 flex-1 resize-none rounded-[1.375rem] bg-foreground/[0.08] px-4 py-2.5 !text-[1.0625rem] outline-none [field-sizing:content] placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <Button size="icon-lg" onClick={send} disabled={sending || !draft.trim()} aria-label="Enviar" className="size-11 shrink-0">
                <Send />
              </Button>
            </div>
            {suggested.size > 0 && (
              <p className="mt-2 flex items-center gap-1 px-1 text-[12px] text-primary">
                <Sparkles className="size-3" />
                Sugerido según lo que escribió el cliente
              </p>
            )}
            <div className="mt-2 -mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 *:shrink-0">
              {actions.map(({ key, label, Icon, onClick, disabled }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={suggested.has(key) ? 'default' : 'outline'}
                  onClick={onClick}
                  disabled={disabled}
                >
                  <Icon />
                  {label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-200">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
              {instagram ? (
                <p>
                  {lastInboundAt
                    ? 'Pasaron más de 24 h desde el último mensaje del cliente.'
                    : 'Este cliente todavía no te ha escrito.'}{' '}
                  Instagram solo permite responder dentro de las 24 h siguientes: podrás escribirle cuando{' '}
                  <strong>te vuelva a escribir</strong>.
                </p>
              ) : (
                <p>
                  {lastInboundAt
                    ? 'Pasaron más de 24 h desde el último mensaje del cliente.'
                    : 'Este cliente todavía no te ha escrito.'}{' '}
                  WhatsApp solo permite escribirle con una <strong>plantilla aprobada por Meta</strong>
                  {formTemplateStatus ? ', como el formulario de datos.' : '.'}
                </p>
              )}
            </div>
            {formButton && <div className="flex justify-end">{formButton}</div>}
          </div>
        )}
      </footer>

      {/* Sin cliente vinculado se precarga el número del chat: el diálogo
          busca un cliente con ese teléfono o lo crea, y al agendar el chat
          queda vinculado a él (sendBookingConfirmationToChat). */}
      <HomeCalendarDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        initialDay={todayKey()}
        presetClientName={client?.name ?? conversation.contact_name ?? ''}
        presetPhone={client?.phone ?? (instagram ? '' : `+${conversation.wa_id}`)}
        presetClientId={client?.id}
        onBooked={(sessionId) => {
          setScheduleOpen(false)
          confirmBooking(sessionId)
        }}
      />

      <ClientLinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        conversationId={conversation.id}
        suggestedName={conversation.contact_name ?? ''}
        currentClientId={conversation.client_id}
        clients={clients}
        onDone={() => router.refresh()}
      />
    </div>
  )
}

function MessageBubble({ message: m }: { message: WaMessage }) {
  const out = m.direction === 'out'
  const mediaSrc = m.media_url ?? (m.media_id ? `/api/whatsapp/media/${m.id}` : null)

  return (
    <div className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-[1.25rem] px-3.5 py-2 text-[1.0625rem] leading-snug sm:max-w-[65%]',
          out ? 'rounded-br-md bg-primary/90 text-primary-foreground' : 'rounded-bl-md bg-foreground/[0.1] text-foreground',
          m.status === 'failed' && 'ring-1 ring-destructive/60'
        )}
      >
        {mediaSrc && (m.type === 'image' || m.type === 'sticker' || m.type === 'template') && (
          <a href={mediaSrc} target="_blank" rel="noreferrer" className="mb-1 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaSrc}
              alt={m.body || 'Foto'}
              loading="lazy"
              className={cn('rounded-lg object-cover', m.type === 'sticker' ? 'size-32' : 'max-h-72 w-full')}
            />
          </a>
        )}
        {mediaSrc && m.type === 'audio' && <audio controls src={mediaSrc} className="mb-1 h-10 max-w-60" />}
        {mediaSrc && m.type === 'video' && (
          <video controls src={mediaSrc} className="mb-1 max-h-72 w-full rounded-lg" preload="metadata" />
        )}
        {mediaSrc && m.type === 'document' && (
          <a
            href={mediaSrc}
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-xs font-medium hover:bg-muted/70"
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{m.media_filename || 'Documento'}</span>
          </a>
        )}
        {m.type === 'unsupported' && (
          <p className="italic text-muted-foreground">Mensaje no soportado (ábrelo en el teléfono).</p>
        )}
        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] opacity-60">
          <span>{formatMessageTime(m.created_at)}</span>
          {out && <StatusIcon status={m.status} />}
        </div>
        {m.status === 'failed' && m.error && <p className="mt-1 text-[12px] text-destructive">{m.error}</p>}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: WaMessage['status'] }) {
  switch (status) {
    case 'sending':
      return <Clock className="size-3" aria-label="Enviando" />
    case 'sent':
      return <Check className="size-3.5" aria-label="Enviado" />
    case 'delivered':
      return <CheckCheck className="size-3.5" aria-label="Entregado" />
    case 'read':
      return <CheckCheck className="size-3.5 text-transfer" aria-label="Leído" />
    case 'failed':
      return <AlertCircle className="size-3.5 text-destructive" aria-label="No enviado" />
    default:
      return null
  }
}
