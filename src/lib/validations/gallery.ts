import { z } from 'zod'

/** Solo imágenes reales: nada de SVG/HTML en un bucket público (XSS/phishing). */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** 8 MB: foto de celular grande; el bodySizeLimit del server action es 10 MB. */
export const MAX_GALLERY_FILE_BYTES = 8 * 1024 * 1024

export const uploadGalleryItemSchema = z.object({
  project_id: z.string().uuid('Proyecto requerido'),
  type: z.enum(['reference','design','progress','final']),
  caption: z.string().optional(),
})

export const updateGalleryItemSchema = z.object({
  caption: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
})

export type UploadGalleryItemInput = z.infer<typeof uploadGalleryItemSchema>
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>
