import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { getCurrentStudio } from '@/queries/studio'
import { getConversations, getWhatsAppAccountStatus } from '@/queries/whatsapp'
import { InboxShell } from '@/components/inbox/inbox-shell'
import { PageHeader } from '@/components/shared/page-header'

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const studio = await getCurrentStudio()
  if (!studio) return null

  const [account, conversationsResult] = await Promise.all([getWhatsAppAccountStatus(), getConversations()])
  const conversations = conversationsResult.success ? conversationsResult.data : []

  // Sin número conectado y sin historial: explicar cómo empezar.
  if (!account && conversations.length === 0) {
    return (
      <div>
        <PageHeader kicker="WhatsApp" title="Mensajes" />
        <div className="mx-auto max-w-lg space-y-4 rounded-2xl bg-card p-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
            <MessageCircle className="size-6" />
          </span>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em]">
            Conecta tu WhatsApp Business
          </h2>
          <p className="text-sm text-muted-foreground">
            Responde a tus clientes desde Crisbo Tattoo: cada chat queda vinculado a su ficha, con sus proyectos y
            citas a la mano.
          </p>
          {studio.role === 'owner' ? (
            <Link
              href="/dashboard/settings/whatsapp"
              className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Conectar número
            </Link>
          ) : (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Pídele al dueño del estudio que conecte el número en Ajustes → WhatsApp.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <InboxShell studioId={studio.id} conversations={conversations}>
      {children}
    </InboxShell>
  )
}
