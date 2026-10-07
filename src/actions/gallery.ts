'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import {
  uploadGalleryItemSchema,
  ALLOWED_IMAGE_TYPES,
  MAX_GALLERY_FILE_BYTES,
} from '@/lib/validations/gallery'
import { ownsRow } from '@/lib/authz'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import type { GalleryItem } from '@/queries/gallery'

async function getStudioId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('artists').select('studio_id').single()
  return data?.studio_id ?? null
}

export async function uploadGalleryItemAction(formData: FormData): Promise<Result<GalleryItem>> {
  const file = formData.get('file') as File | null
  if (!file) return err('VALIDATION_ERROR', 'Archivo requerido')

  // Bucket público: solo imágenes reales, extensión derivada del MIME (no del nombre).
  const ext = ALLOWED_IMAGE_TYPES[file.type]
  if (!ext)
    return err('VALIDATION_ERROR', 'Formato no soportado. Usa JPG, PNG o WebP.')
  if (file.size > MAX_GALLERY_FILE_BYTES)
    return err('VALIDATION_ERROR', 'La foto supera el máximo de 8 MB.')

  const input = {
    project_id: formData.get('project_id') as string,
    type: formData.get('type') as string,
    caption: formData.get('caption') as string || undefined,
  }

  const parsed = uploadGalleryItemSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const studioId = await getStudioId()
  if (!studioId) return err('AUTH_ERROR', 'No autenticado')

  if (!(await ownsRow('projects', parsed.data.project_id)))
    return err('NOT_FOUND', 'Proyecto no encontrado')

  const fileName = `${randomUUID()}.${ext}`
  const storagePath = `${studioId}/${parsed.data.project_id}/${parsed.data.type}/${fileName}`

  const supabase = await createClient()

  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(storagePath, file, { contentType: file.type })

  if (uploadError) {
    console.error('[storage]', uploadError.message)
    return err('DB_ERROR', 'No se pudo subir la foto. Intenta de nuevo.')
  }

  const { data: { publicUrl } } = supabase.storage
    .from('gallery')
    .getPublicUrl(storagePath)

  const { data, error } = await supabase
    .from('gallery')
    .insert({
      studio_id: studioId,
      project_id: parsed.data.project_id,
      type: parsed.data.type,
      storage_path: storagePath,
      url: publicUrl,
      caption: parsed.data.caption,
    })
    .select()
    .single()

  if (error) return dbError(error)
  revalidatePath(`/dashboard/projects/${parsed.data.project_id}`)
  revalidatePath('/dashboard/gallery')
  return ok(data as GalleryItem)
}

export async function deleteGalleryItemAction(id: string, storagePath: string): Promise<Result<void>> {
  const supabase = await createClient()

  await supabase.storage.from('gallery').remove([storagePath])

  const { error } = await supabase.from('gallery').delete().eq('id', id)
  if (error) return dbError(error)

  revalidatePath('/dashboard/gallery')
  return ok(undefined)
}
