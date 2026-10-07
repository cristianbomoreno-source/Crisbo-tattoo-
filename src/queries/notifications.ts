import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type NotificationItem = {
  id: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export async function getNotifications(limit = 20): Promise<Result<NotificationItem[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return dbError(error)
  return ok(data as NotificationItem[])
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)
  return count ?? 0
}
