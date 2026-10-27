'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BellOff, BellRing, Check, ChevronDown, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setFollowUp, setLeadStage } from '@/actions/whatsapp'
import { markLeadLostAction } from '@/actions/crm'
import { LostReasonDialog } from './lost-reason-dialog'
import {
  FOLLOW_UP_OPTIONS,
  LEAD_STAGES,
  followUpDate,
  followUpDue,
  type LeadStage,
} from '@/lib/whatsapp-cloud/lead'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatFollowUp } from './format'

/** Etapas del embudo en orden; "Perdido" va aparte (no es un paso). */
const PIPELINE = LEAD_STAGES.filter((s) => s.key !== 'perdido')

/**
 * Barra de seguimiento del lead, arriba del chat: la etapa del embudo
 * (Nuevo → Cotizando → Esperando abono → Agendado, o Perdido) y un
 * recordatorio de seguimiento. Los cambios se ven al instante y se guardan
 * en segundo plano; si fallan, se revierten.
 */
export function LeadBar({
  conversationId,
  stage: initialStage,
  followUpAt: initialFollowUp,
  clientId = null,
}: {
  conversationId: string
  /** Cliente vinculado: ahí se guarda el motivo si el lead se pierde. */
  clientId?: string | null
  stage: LeadStage
  followUpAt: string | null
}) {
  const [stage, setStage] = useState<LeadStage>(initialStage)
  const [followUp, setFollowUpState] = useState(initialFollowUp)
  const [, startTransition] = useTransition()
  const [askLost, setAskLost] = useState(false)

  const currentIndex = PIPELINE.findIndex((s) => s.key === stage)
  const lost = stage === 'perdido'
  const due = followUpDue(followUp)

  function changeStage(next: LeadStage) {
    if (next === stage) return
    if (next === 'perdido') {
      setAskLost(true)
      return
    }
    const prev = stage
    setStage(next)
    startTransition(async () => {
      const result = await setLeadStage(conversationId, next)
      if (!result.success) {
        setStage(prev)
        toast.error(result.error.message)
      }
    })
  }

  function confirmLost(reason: string) {
    setAskLost(false)
    const prev = stage
    setStage('perdido')
    setFollowUpState(null)
    startTransition(async () => {
      const result = await markLeadLostAction(conversationId, clientId, reason)
      if (!result.success) {
        setStage(prev)
        toast.error(result.error.message)
      } else toast.success(`Perdido · ${reason}`)
    })
  }

  function changeFollowUp(at: string | null) {
    const prev = followUp
    setFollowUpState(at)
    startTransition(async () => {
      const result = await setFollowUp(conversationId, at)
      if (!result.success) {
        setFollowUpState(prev)
        toast.error(result.error.message)
        return
      }
      toast.success(at ? `Te recordaremos este chat: ${formatFollowUp(at)}` : 'Recordatorio quitado')
    })
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <LostReasonDialog open={askLost} onOpenChange={setAskLost} onPick={confirmLost} />
      {/* Embudo: los pasos anteriores quedan marcados como hechos. */}
      <div
        role="radiogroup"
        aria-label="Etapa del lead"
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]"
      >
        {PIPELINE.map((s, i) => {
          const active = s.key === stage
          const done = !lost && currentIndex > i
          return (
            <div key={s.key} className="flex shrink-0 items-center gap-1">
              {i > 0 && <span aria-hidden className={cn('h-0.5 w-2 rounded-full sm:w-3', done || active ? 'bg-primary/60' : 'bg-border')} />}
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changeStage(s.key)}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-95',
                  active
                    ? cn(s.tile, 'text-white')
                    : done
                      ? 'bg-foreground/[0.06] text-foreground'
                      : 'bg-foreground/[0.06] text-muted-foreground'
                )}
              >
                {done ? (
                  <Check className="size-3.5 text-primary" />
                ) : active ? null : (
                  <span className="size-2 rounded-full bg-muted-foreground/40" />
                )}
                {s.label}
              </button>
            </div>
          )
        })}
        <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-border" />
        <button
          type="button"
          role="radio"
          aria-checked={lost}
          onClick={() => changeStage(lost ? 'nuevo' : 'perdido')}
          title={lost ? 'Reabrir lead' : 'Marcar como perdido'}
          className={cn(
            'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-95',
            lost ? 'tile-gray text-white' : 'bg-foreground/[0.06] text-muted-foreground'
          )}
        >
          <XCircle className="size-3.5" />
          Perdido
        </button>
      </div>

      {/* Recordatorio de seguimiento. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
            followUp
              ? due
                ? 'bg-destructive text-white'
                : 'bg-primary/15 text-primary'
              : 'bg-foreground/[0.08] text-foreground'
          )}
        >
          <BellRing className="size-3.5" />
          <span suppressHydrationWarning className="hidden sm:inline">
            {followUp ? (due ? 'Seguimiento pendiente' : formatFollowUp(followUp)) : 'Seguimiento'}
          </span>
          <ChevronDown className="size-3 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel suppressHydrationWarning>
            {followUp ? `Recordatorio: ${formatFollowUp(followUp)}` : 'Recordarme escribirle'}
          </DropdownMenuLabel>
          {FOLLOW_UP_OPTIONS.map((o) => (
            <DropdownMenuItem key={o.key} onClick={() => changeFollowUp(followUpDate(o.hours).toISOString())}>
              <BellRing />
              {o.label}
            </DropdownMenuItem>
          ))}
          {followUp && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => changeFollowUp(null)}>
                <BellOff />
                Quitar recordatorio
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
