import { MessageCircle } from 'lucide-react'

/** Escritorio: panel derecho vacío hasta elegir un chat (en móvil no se ve). */
export default function InboxPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
      <MessageCircle className="size-10 opacity-40" strokeWidth={1.4} />
      <p className="text-sm">Elige un chat para ver la conversación.</p>
    </div>
  )
}
