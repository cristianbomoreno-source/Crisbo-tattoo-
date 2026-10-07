'use server'

import { randomBytes } from 'crypto'

import { createClient } from '@/lib/supabase/server'
import { ownsRow } from '@/lib/authz'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

const EXPIRY_DAYS = 7

/** Estudio: genera (o renueva) el link de la landing privada de una
 * cotización. Un solo link por cotización (`quote_id` es único) — si ya
 * existe, solo se extiende la expiración 7 días desde ahora, conservando el
 * mismo token para no invalidar mensajes de WhatsApp ya enviados. Pasados
 * los 7 días sin reenvío, `getPublicQuoteProject` deja de servir la página. */
export async function createQuoteLinkAction(quoteId: string): Promise<Result<{ token: string; expiresAt: string }>> {
  const supabase = await createClient()
  const { data: artist } = await supabase.from('artists').select('studio_id').single()
  const studioId = artist?.studio_id
  if (!studioId) return err('AUTH_ERROR', 'No autenticado')

  if (!(await ownsRow('quotes', quoteId))) return err('NOT_FOUND', 'Cotización no encontrada')

  const { data: quote } = await supabase.from('quotes').select('client_id').eq('id', quoteId).single()
  if (!quote) return err('NOT_FOUND', 'Cotización no encontrada')

  const expires_at = new Date(Date.now() + EXPIRY_DAYS * 86_400_000).toISOString()

  const { data: existing } = await supabase
    .from('quote_links')
    .select('token')
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('quote_links').update({ expires_at }).eq('quote_id', quoteId)
    if (error) return dbError(error)
    return ok({ token: existing.token, expiresAt: expires_at })
  }

  const token = randomBytes(24).toString('base64url')
  const { error } = await supabase
    .from('quote_links')
    .insert({ studio_id: studioId, quote_id: quoteId, client_id: quote.client_id, token, expires_at })
  if (error) return dbError(error)

  return ok({ token, expiresAt: expires_at })
}
