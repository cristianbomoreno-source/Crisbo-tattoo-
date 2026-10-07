'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { createQuoteSchema, updateQuoteSchema } from '@/lib/validations/quotes'
import { ALLOWED_IMAGE_TYPES, MAX_GALLERY_FILE_BYTES } from '@/lib/validations/gallery'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { ownsRow } from '@/lib/authz'
import type { Quote } from '@/queries/quotes'
import { getCurrentPermissions } from '@/queries/permissions'

async function getArtistAndStudio() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select('id, studio_id')
    .single()
  return data
}

/** Sube uno o varios archivos al bucket `quote-photos` de una cotización.
 * Bucket público: solo imágenes reales, extensión derivada del MIME (nunca del
 * nombre que manda el cliente) y nombre aleatorio. Ignora en silencio los que
 * fallen o no pasen la validación, igual que el bot. */
async function uploadQuotePhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studioId: string,
  quoteId: string,
  files: File[]
): Promise<string[]> {
  const paths: string[] = []
  for (const file of files) {
    const ext = ALLOWED_IMAGE_TYPES[file.type]
    if (!ext) continue
    if (file.size > MAX_GALLERY_FILE_BYTES) continue

    const path = `${studioId}/${quoteId}/${randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('quote-photos')
      .upload(path, file, { contentType: file.type })
    if (!error) paths.push(path)
  }
  return paths
}

export async function createQuoteAction(formData: FormData): Promise<Result<Quote>> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = createQuoteSchema.safeParse({
    ...raw,
    is_courtesy: raw.is_courtesy === 'true',
  })
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  if (!(await ownsRow('clients', parsed.data.client_id)))
    return err('NOT_FOUND', 'Cliente no encontrado')

  const supabase = await createClient()
  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({
      ...parsed.data,
      price: parsed.data.is_courtesy ? 0 : parsed.data.price,
      studio_id: artist.studio_id,
      artist_id: artist.id,
    })
    .select()
    .single()

  if (error) return dbError(error)

  const mainFile = formData.get('reference_photo')
  const extraFiles = formData.getAll('extra_photos').filter((f): f is File => f instanceof File && f.size > 0)
  const filesToUpload = [
    ...(mainFile instanceof File && mainFile.size > 0 ? [mainFile] : []),
    ...extraFiles,
  ]
  if (filesToUpload.length > 0) {
    const uploaded = await uploadQuotePhotos(supabase, artist.studio_id, quote.id, filesToUpload)
    if (uploaded.length > 0) {
      await supabase
        .from('quotes')
        .update({ reference_photo_path: uploaded[0], extra_photo_paths: uploaded.slice(1) })
        .eq('id', quote.id)
      quote.reference_photo_path = uploaded[0]
      quote.extra_photo_paths = uploaded.slice(1)
    }
  }

  revalidatePath('/dashboard/quotes')
  return ok(quote as Quote)
}

export async function updateQuoteAction(
  quoteId: string,
  formData: FormData
): Promise<Result<Quote>> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = updateQuoteSchema.safeParse({
    ...raw,
    is_courtesy: raw.is_courtesy === 'true',
  })
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  if (!(await getArtistAndStudio())) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_respond_quotes)
    return err('FORBIDDEN', 'No tienes permiso para responder cotizaciones')
  if (gate && !gate.permissions.can_modify_prices && !parsed.data.is_courtesy)
    return err('FORBIDDEN', 'No tienes permiso para modificar precios')

  if (!(await ownsRow('quotes', quoteId))) return err('NOT_FOUND', 'Cotización no encontrada')

  // Whitelist explícita de campos editables: client_id y status no se tocan
  // aquí aunque lleguen en el form (el cliente es inmutable tras crear la
  // cotización y el estado se maneja aparte con updateQuoteStatusAction), y
  // esto también blinda contra campos nuevos que el schema agregue a futuro.
  const { body_zone, style, description, is_courtesy, session_count, avg_session_duration, deposit_percentage, notes } =
    parsed.data

  const supabase = await createClient()

  // Fotos de referencia: quitar las marcadas para borrar y agregar las
  // nuevas, sobre el estado actual guardado (no sobre lo que mande el
  // formulario, para no confiar en el cliente).
  const { data: current } = await supabase
    .from('quotes')
    .select('reference_photo_path, extra_photo_paths, studio_id')
    .eq('id', quoteId)
    .single()

  let referencePhotoPath = current?.reference_photo_path ?? null
  let extraPhotoPaths = current?.extra_photo_paths ?? []

  const removedPaths = formData.getAll('removed_photos').filter((p): p is string => typeof p === 'string' && p.length > 0)
  if (removedPaths.length > 0) {
    await supabase.storage.from('quote-photos').remove(removedPaths)
    if (referencePhotoPath && removedPaths.includes(referencePhotoPath)) referencePhotoPath = null
    extraPhotoPaths = extraPhotoPaths.filter((p: string) => !removedPaths.includes(p))
  }

  const newFiles = formData.getAll('new_photos').filter((f): f is File => f instanceof File && f.size > 0)
  if (newFiles.length > 0 && current?.studio_id) {
    const uploaded = await uploadQuotePhotos(supabase, current.studio_id, quoteId, newFiles)
    for (const path of uploaded) {
      if (!referencePhotoPath) referencePhotoPath = path
      else extraPhotoPaths = [...extraPhotoPaths, path]
    }
  }

  const { data, error } = await supabase
    .from('quotes')
    .update({
      body_zone,
      style,
      description,
      is_courtesy,
      price: is_courtesy ? 0 : parsed.data.price,
      session_count,
      avg_session_duration,
      deposit_percentage,
      notes,
      reference_photo_path: referencePhotoPath,
      extra_photo_paths: extraPhotoPaths,
    })
    .eq('id', quoteId)
    .select()
    .single()

  if (error) return dbError(error)

  revalidatePath('/dashboard/quotes')
  revalidatePath(`/dashboard/quotes/${quoteId}`)
  return ok(data as Quote)
}

export async function updateQuoteStatusAction(
  id: string,
  status: Quote['status']
): Promise<Result<Quote>> {
  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_respond_quotes)
    return err('FORBIDDEN', 'No tienes permiso para responder cotizaciones')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError(error)
  revalidatePath('/dashboard/quotes')
  revalidatePath(`/dashboard/quotes/${id}`)
  return ok(data as Quote)
}

export async function convertQuoteToProjectAction(
  quoteId: string
): Promise<Result<{ projectId: string }>> {
  const artist = await getArtistAndStudio()
  if (!artist) return err('AUTH_ERROR', 'No autenticado')

  const gate = await getCurrentPermissions()
  if (gate && !gate.permissions.can_respond_quotes)
    return err('FORBIDDEN', 'No tienes permiso para responder cotizaciones')

  const supabase = await createClient()
  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()
  if (qErr || !quote) return err('NOT_FOUND', 'Cotización no encontrada')

  const name =
    [quote.style, quote.body_zone].filter(Boolean).join(' — ') || 'Nuevo proyecto'

  const depositAmount = quote.is_courtesy
    ? 0
    : Math.round(((quote.price ?? 0) * (quote.deposit_percentage ?? 20)) / 100)

  const { data: project, error: pErr } = await supabase
    .from('projects')
    .insert({
      studio_id: artist.studio_id,
      artist_id: artist.id,
      client_id: quote.client_id,
      name,
      status: 'design',
      total_value: quote.price,
      deposit: depositAmount,
      session_count: quote.session_count,
      deposit_percentage: quote.deposit_percentage,
      notes: quote.description ?? quote.notes ?? null,
    })
    .select('id')
    .single()
  if (pErr) return dbError(pErr)

  // El abono acordado en la cotización se registra como pago hecho, para que el
  // saldo pendiente del proyecto ya lo reste (feedback de Crisbo).
  if (depositAmount > 0) {
    await supabase.from('payments').insert({
      studio_id: artist.studio_id,
      project_id: project.id,
      amount: depositAmount,
      type: 'deposit',
      notes: 'Abono de la cotización',
    })
  }

  await supabase.from('quotes').update({ status: 'approved' }).eq('id', quoteId)

  // La foto de referencia de la cotización pasa a ser la foto del proyecto
  // (bucket 'quote-photos' → 'gallery', para que aparezca en su galería).
  if (quote.reference_photo_path) {
    const download = await supabase.storage
      .from('quote-photos')
      .download(quote.reference_photo_path)
    if (!download.error && download.data) {
      const ext = quote.reference_photo_path.split('.').pop() ?? 'jpg'
      const newPath = `${artist.studio_id}/${project.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('gallery')
        .upload(newPath, download.data, { contentType: download.data.type })
      if (!upErr) {
        const { data: pub } = supabase.storage.from('gallery').getPublicUrl(newPath)
        await supabase.from('gallery').insert({
          studio_id: artist.studio_id,
          project_id: project.id,
          artist_id: artist.id,
          type: 'reference',
          storage_path: newPath,
          url: pub.publicUrl,
        })
      }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/quotes')
  return ok({ projectId: project.id })
}

export async function deleteQuoteAction(id: string): Promise<Result<void>> {
  const supabase = await createClient()

  // projects.quote_id es ON DELETE SET NULL, así que Postgres no bloquea por
  // FK — hay que chequearlo a mano para no perder el rastro de la conversión.
  const { data: linkedProject } = await supabase
    .from('projects')
    .select('id')
    .eq('quote_id', id)
    .maybeSingle()
  if (linkedProject) {
    return err(
      'VALIDATION_ERROR',
      'No puedes eliminar esta cotización: ya fue convertida en un proyecto.'
    )
  }

  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) return dbError(error)
  revalidatePath('/dashboard/quotes')
  return ok(undefined)
}
