import { notFound } from 'next/navigation'
import { getConversation, getMessages, getWhatsAppAccountStatus } from '@/queries/whatsapp'
import { getClients } from '@/queries/clients'
import { ChatView } from '@/components/inbox/chat-view'
import { getCampaignChatInfo } from '@/queries/campaigns'
import { getCurrentStudio } from '@/queries/studio'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [conversationResult, messagesResult, clientsResult, account] = await Promise.all([
    getConversation(id),
    getMessages(id),
    getClients(),
    getWhatsAppAccountStatus(),
  ])
  if (!conversationResult.success) notFound()
  const studio = await getCurrentStudio()
  const campaign =
    studio?.role === 'owner'
      ? await getCampaignChatInfo(id, conversationResult.data.client_id).catch(() => null)
      : null

  const clients = clientsResult.success
    ? clientsResult.data.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))
    : []

  return (
    <ChatView
      // key: al cambiar de chat se reinicia el estado (mensajes, borrador).
      key={id}
      conversation={conversationResult.data}
      initialMessages={messagesResult.success ? messagesResult.data : []}
      clients={clients}
      formTemplateStatus={account?.formTemplateStatus ?? null}
      campaign={campaign}
    />
  )
}
