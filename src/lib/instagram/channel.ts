/** Canal de cada chat de la bandeja de Mensajes. */
export type ChatChannel = 'whatsapp' | 'instagram'

/** Sin la columna `channel` (antes de la migración) todo es WhatsApp. */
export function chatChannel(c: { channel?: ChatChannel | null }): ChatChannel {
  return c.channel === 'instagram' ? 'instagram' : 'whatsapp'
}
