import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadContactGroups, type ContactGroup } from '@/lib/crm/contact-groups'

const WAITING_QUOTE_STATUSES = ['new', 'reviewed', 'quoted']

/**
 * Plata en juego por cliente, para el embudo de Mensajes: lo que falta por
 * cobrar de sus proyectos abiertos o, si no tiene, el precio de su
 * cotización en espera más reciente. RLS limita al estudio activo.
 */
export async function getLeadValues(clientIds: string[]): Promise<Record<string, number>> {
  const ids = [...new Set(clientIds)]
  if (ids.length === 0) return {}
  const supabase = await createClient()
  const values: Record<string, number> = {}
  const quoteValues: Record<string, { price: number; at: string }> = {}

  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    const [projects, quotes] = await Promise.all([
      supabase.from('projects').select('client_id, total_value, payments(amount)').in('client_id', chunk).neq('status', 'completed'),
      supabase.from('quotes').select('client_id, price, created_at').in('client_id', chunk).in('status', WAITING_QUOTE_STATUSES),
    ])
    for (const p of (projects.data ?? []) as { client_id: string; total_value: number | null; payments: { amount: number }[] }[]) {
      const paid = (p.payments ?? []).reduce((s, x) => s + (x.amount ?? 0), 0)
      const open = Math.max(0, (p.total_value ?? 0) - paid)
      values[p.client_id] = (values[p.client_id] ?? 0) + open
    }
    for (const q of (quotes.data ?? []) as { client_id: string | null; price: number | null; created_at: string }[]) {
      if (!q.client_id || !q.price) continue
      const prev = quoteValues[q.client_id]
      if (!prev || q.created_at > prev.at) quoteValues[q.client_id] = { price: q.price, at: q.created_at }
    }
  }

  for (const [clientId, q] of Object.entries(quoteValues)) {
    if (!values[clientId]) values[clientId] = q.price
  }
  return values
}

/** Chats "Personal" del estudio: { conversationId: grupo }. */
export async function getContactGroups(studioId: string): Promise<Record<string, ContactGroup>> {
  return loadContactGroups(createAdminClient(), studioId).catch(() => ({}))
}
