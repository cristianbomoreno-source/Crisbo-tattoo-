import { notFound } from 'next/navigation'
import { getConversation, getMessages } from '@/queries/whatsapp'
import { getClients } from '@/queries/clients'
import { ChatView } from '@/components/inbox/chat-view'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [conversationResult, messagesResult, clientsResult] = await Promise.all([
    getConversation(id),
    getMessages(id),
    getClients(),
  ])
  if (!conversationResult.success) notFound()

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
    />
  )
}
