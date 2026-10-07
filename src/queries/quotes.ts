import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getCurrentStudio } from '@/queries/studio'

export type Quote = {
  id: string
  studio_id: string
  client_id: string
  artist_id: string
  body_zone: string | null
  service: string | null
  style: string | null
  description: string | null
  price: number | null
  is_courtesy: boolean
  session_count: number | null
  avg_session_duration: string | null
  deposit_percentage: number
  reference_photo_path: string | null
  size: string | null
  color: string | null
  skin_tone: string | null
  gender: string | null
  age: number | null
  availability: string | null
  source: 'manual' | 'bot'
  extra_photo_paths: string[] | null
  status: 'new' | 'reviewed' | 'quoted' | 'approved' | 'rejected'
  notes: string | null
  created_at: string
  updated_at: string
}

export type QuoteWithClient = Quote & {
  clients: { name: string; phone: string | null; email: string | null } | null
}

export async function getQuotes(status?: string): Promise<Result<QuoteWithClient[]>> {
  const studio = await getCurrentStudio()
  const supabase = await createClient()
  let query = supabase
    .from('quotes')
    .select('*, clients(name, phone, email)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (studio && studio.role !== 'owner') query = query.eq('artist_id', studio.artistId)

  const { data, error } = await query
  if (error) return dbError(error)
  return ok(data as QuoteWithClient[])
}

export async function getQuote(id: string): Promise<Result<QuoteWithClient>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients(name, phone, email)')
    .eq('id', id)
    .single()

  if (error) return err('NOT_FOUND', 'Cotización no encontrada')
  return ok(data as QuoteWithClient)
}
