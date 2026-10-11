'use client'

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Banknote,
  CalendarPlus,
  Check,
  CheckCheck,
  ClipboardList,
  Clock,
  FileText,
  Link2,
  MapPin,
  Send,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { isServiceWindowOpen } from '@/lib/whatsapp-cloud/parse'
import {
  markConversationRead,
  sendBookingConfirmationToChat,
  sendDataForm,
  sendStudioLocation,
  sendWhatsAppMessage,
  setConversationArchived,
} from '@/actions/whatsapp'
import type { WaConversation, WaMessage } from '@/queries/whatsapp'
import { Button } from '@/components/ui/button'
import { HomeCalendarDialog } from '@/components/home/home-calendar-dialog'
import { todayKey } from '@/lib/calendar/utils'
import { ClientLinkDialog } from './client-link-dialog'
import {
  formatDayLabel,
  formatMessageTime,
  formatWaPhone,
  formatWindowRemaining,
  sameDay,
} from './format'

/** Lo que envía el botón "Pedir comprobante" (texto exacto del estudio). */
const PAYMENT_PROOF_MESSAGE = 'Una vez efectuado el abono, envía el comprobante'

type ClientOption = { id: string; name: string; phone: string | null }

export function ChatView({
  conversation,
  initialMessages,
  clients,
  formTemplateStatus,
}: {
  conversation: WaConversation
  initialMessages: WaMessage[]
  clients: ClientOption[]
  /** Estado en Meta de la plantilla del formulario de datos (null = no creada). */
  formTemplateStatus: string | null
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [lastInboundAt, setLastInboundAt] = useState(conversation.last_inbound_at)
  const [linkOpen, setLinkOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [sending, startSending] = useTransition()
  const [archiving, startArchiving] = useTransition()
  const [sendingForm, startSendingForm] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const name = conversation.client?.name || conversation.contact_name || formatWaPhone(conversation.wa_id)
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

  /** Botón "Pedir comprobante": envía el texto tal cual, sin pasar por el borrador. */
  function askPaymentProof() {
    if (sending) return
    startSending(async () => {
      const result = await sendWhatsAppMessage({ conversationId: conversation.id, body: PAYMENT_PROOF_MESSAGE })
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

  const formButton = formTemplateStatus ? (
    <Button size="sm" variant="outline" onClick={sendForm} disabled={sendingForm}>
      <ClipboardList />
      {sendingForm ? 'Enviando…' : 'Enviar formulario'}
    </Button>
  ) : null

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
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-border/60 px-2 py-2 sm:px-3">
        <Link
          href="/dashboard/inbox"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent/60 lg:hidden"
          aria-label="Volver a los chats"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            <button
              type="button"
              onClick={() => setScheduleOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <CalendarPlus className="size-3.5" />
              Agendar cita
            </button>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {formatWaPhone(conversation.wa_id)}
            {conversation.contact_name && conversation.client && conversation.contact_name !== conversation.client.name
              ? ` · ${conversation.contact_name}`
              : ''}
          </p>
        </div>
        {conversation.client ? (
          <Link
            href={`/dashboard/clients/${conversation.client.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <UserRound className="size-3.5" />
            <span className="hidden sm:inline">Ver ficha</span>
          </Link>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
            <UserPlus />
            <span className="hidden sm:inline">Guardar cliente</span>
          </Button>
        )}
        {conversation.client && (
          <Button size="icon-sm" variant="ghost" onClick={() => setLinkOpen(true)} aria-label="Cambiar cliente vinculado">
            <Link2 />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={toggleArchive}
          disabled={archiving}
          aria-label={conversation.archived ? 'Desarchivar' : 'Archivar'}
        >
          {conversation.archived ? <ArchiveRestore /> : <Archive />}
        </Button>
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto bg-background/40 px-3 py-4">
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const showDay = !prev || !sameDay(prev.created_at, m.created_at)
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium capitalize text-muted-foreground">
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
      <footer className="border-t border-border/60 p-2 sm:p-3">
        {windowOpen ? (
          <>
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
                className="max-h-40 min-h-10 flex-1 resize-none rounded-xl bg-muted px-3 py-2.5 text-sm outline-none [field-sizing:content] placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <Button size="icon-lg" onClick={send} disabled={sending || !draft.trim()} aria-label="Enviar">
                <Send />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" onClick={sendLocation} disabled={sending}>
                <MapPin />
                Ubicación
              </Button>
              <Button size="sm" variant="outline" onClick={askPaymentProof} disabled={sending}>
                <Banknote />
                Pedir comprobante
              </Button>
              {formButton}
            </div>
            {remaining && (
              <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
                Puedes responder libremente durante {remaining} más.
              </p>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-200">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <p>
                {lastInboundAt
                  ? 'Pasaron más de 24 h desde el último mensaje del cliente.'
                  : 'Este cliente todavía no te ha escrito.'}{' '}
                WhatsApp solo permite escribirle con una <strong>plantilla aprobada por Meta</strong>
                {formTemplateStatus ? ', como el formulario de datos.' : '.'}
              </p>
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
        presetPhone={client?.phone ?? `+${conversation.wa_id}`}
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
  const mediaSrc = m.media_id ? `/api/whatsapp/media/${m.id}` : null

  return (
    <div className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[70%]',
          out ? 'rounded-br-md bg-primary/20 text-foreground' : 'rounded-bl-md bg-card text-foreground ring-1 ring-border/50',
          m.status === 'failed' && 'ring-1 ring-destructive/60'
        )}
      >
        {mediaSrc && (m.type === 'image' || m.type === 'sticker') && (
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
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>{formatMessageTime(m.created_at)}</span>
          {out && <StatusIcon status={m.status} />}
        </div>
        {m.status === 'failed' && m.error && <p className="mt-1 text-[11px] text-destructive">{m.error}</p>}
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
      return <CheckCheck className="size-3.5 text-sky-400" aria-label="Leído" />
    case 'failed':
      return <AlertCircle className="size-3.5 text-destructive" aria-label="No enviado" />
    default:
      return null
  }
}
