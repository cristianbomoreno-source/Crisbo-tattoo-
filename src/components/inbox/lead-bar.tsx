'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BellOff, BellRing, Check, ChevronDown, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setFollowUp, setLeadStage } from '@/actions/whatsapp'
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
}: {
  conversationId: string
  stage: LeadStage
  followUpAt: string | null
}) {
  const [stage, setStage] = useState<LeadStage>(initialStage)
  const [followUp, setFollowUpState] = useState(initialFollowUp)
  const [, startTransition] = useTransition()

  const currentIndex = PIPELINE.findIndex((s) => s.key === stage)
  const lost = stage === 'perdido'
  const due = followUpDue(followUp)

  function changeStage(next: LeadStage) {
    if (next === stage) return
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
    <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-2 py-2 sm:px-3">
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
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn('h-px w-2.5 sm:w-4', done || active ? 'bg-primary/60' : 'bg-border')}
                />
              )}
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changeStage(s.key)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
                  active
                    ? cn(s.chip, 'ring-1 ring-current/30')
                    : done
                      ? 'text-foreground hover:bg-accent/60'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                {done ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <span className={cn('size-2 rounded-full', active ? s.dot : 'bg-muted-foreground/40')} />
                )}
                {s.label}
              </button>
            </div>
          )
        })}
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />
        <button
          type="button"
          role="radio"
          aria-checked={lost}
          onClick={() => changeStage(lost ? 'nuevo' : 'perdido')}
          title={lost ? 'Reabrir lead' : 'Marcar como perdido'}
          className={cn(
            'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
            lost
              ? 'bg-destructive/15 text-destructive ring-1 ring-destructive/30'
              : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
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
            'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
            followUp
              ? due
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-primary/15 text-primary hover:bg-primary/25'
              : 'bg-card text-foreground ring-1 ring-border hover:bg-accent'
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
