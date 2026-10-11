'use client'

import Link from 'next/link'
import { Settings2, Zap } from 'lucide-react'
import type { WaQuickReply } from '@/queries/whatsapp'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Botón ⚡ del chat: inserta una respuesta guardada en el cuadro de texto
 * (no la envía sola, para poder ajustarla antes). */
export function QuickRepliesMenu({
  replies,
  onPick,
}: {
  replies: WaQuickReply[]
  onPick: (body: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Respuestas rápidas"
        className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/60 hover:text-primary"
      >
        <Zap className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-72">
        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Respuestas rápidas</p>
        {replies.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">Todavía no tienes respuestas guardadas.</p>
        ) : (
          replies.map((r) => (
            <DropdownMenuItem key={r.id} onClick={() => onPick(r.body)} className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-sm font-medium">{r.title}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{r.body}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/dashboard/settings/whatsapp#respuestas-rapidas" />}
          className="gap-2 text-xs text-muted-foreground"
        >
          <Settings2 className="size-3.5" />
          Editar respuestas rápidas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
