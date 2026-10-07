'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { getNotifications, getUnreadNotificationCount, type NotificationItem } from '@/queries/notifications'
import { revalidatePath } from 'next/cache'

export async function getNotificationsAction(): Promise<
  Result<{ items: NotificationItem[]; unread: number }>
> {
  const [itemsRes, unread] = await Promise.all([getNotifications(), getUnreadNotificationCount()])
  if (!itemsRes.success) return itemsRes
  return ok({ items: itemsRes.data, unread })
}

export async function markNotificationReadAction(id: string): Promise<Result<void>> {
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) return dbError(error)
  revalidatePath('/dashboard')
  return ok(undefined)
}

export async function markAllNotificationsReadAction(): Promise<Result<void>> {
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false)
  if (error) return dbError(error)
  revalidatePath('/dashboard')
  return ok(undefined)
}
