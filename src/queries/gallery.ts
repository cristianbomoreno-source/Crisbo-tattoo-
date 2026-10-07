import { createClient } from '@/lib/supabase/server'
import { ok, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'

export type GalleryItemType = 'reference' | 'design' | 'progress' | 'final'

export type GalleryItem = {
  id: string
  studio_id: string
  project_id: string
  type: GalleryItemType
  storage_path: string
  url: string
  caption: string | null
  sort_order: number
  created_at: string
}

export async function getGallery(projectId: string): Promise<Result<GalleryItem[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .eq('project_id', projectId)
    .order('type')
    .order('sort_order')

  if (error) return dbError(error)
  return ok(data as GalleryItem[])
}

export async function getStudioGallery(): Promise<Result<GalleryItem[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .eq('type', 'final')
    .order('created_at', { ascending: false })

  if (error) return dbError(error)
  return ok(data as GalleryItem[])
}
