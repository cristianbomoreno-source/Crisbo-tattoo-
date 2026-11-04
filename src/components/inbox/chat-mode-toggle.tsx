'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { setChatMode } from '@/actions/ad-agent'
import { cn } from '@/lib/utils'
import type { ChatMode } from '@/lib/ad-agent/guard'

/** Quién contesta este chat: la IA o Crisbo. El interruptor general sigue en
 * Ajustes → Agente de pauta: si está apagado, aquí se deja escogido. */
export function ChatModeToggle({ conversationId, mode, agentEnabled }: { conversationId: string; mode: ChatMode; agentEnabled: boolean }) {
  const [current, setCurrent] = useState(mode)
  const [pending, start] = useTransition()

  function choose(next: ChatMode) {
    if (next === current) return
    setCurrent(next)
    start(async () => {
      const result = await setChatMode({ conversationId, mode: next })
      if (!result.success) {
        setCurrent(current)
        toast.error(result.error.message)
      }
    })
  }

  return (
    <span
      role="group"
      aria-label="Quién responde este chat"
      title={agentEnabled ? undefined : 'El agente está apagado en Ajustes'}
      className={cn('ml-1 inline-flex shrink-0 rounded-full bg-foreground/[0.08] p-0.5', !agentEnabled && 'opacity-60')}
    >
      {(['ai', 'human'] as const).map((value) => (
        <button
          key={value}
          type="button"
          disabled={pending}
          aria-pressed={current === value}
          onClick={() => choose(value)}
          className={cn(
            'h-9 min-w-9 rounded-full px-2 text-[13px] font-semibold transition-colors duration-150',
            current === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          {value === 'ai' ? 'IA' : 'Yo'}
        </button>
      ))}
    </span>
  )
}
