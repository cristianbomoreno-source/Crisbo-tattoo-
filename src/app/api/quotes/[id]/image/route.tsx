import { getQuote } from '@/queries/quotes'
import { getCurrentStudio } from '@/queries/studio'
import { createClient } from '@/lib/supabase/server'
import { buildQuoteTemplateData } from '@/lib/pdf/quote-template-data'
import { generateQr } from '@/lib/pdf/qr'
import { QuoteOgImage } from '@/lib/pdf/quote-og-image'
import { QuoteOgImageFallback } from '@/lib/pdf/quote-og-image-fallback'
import { safeImageUrl } from '@/lib/pdf/safe-image-url'
import { renderPng } from '@/lib/pdf/render-png'

// Deja margen de sobra: la imagen fetchea varias fotos remotas (hero +
// referencias + logo) antes de poder renderizar — con el plan gratis de
// Vercel el límite por defecto (10s) se queda corto en una red lenta.
export const maxDuration = 30

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getQuote(id)
  if (!result.success) return new Response('No encontrada', { status: 404 })
  const q = result.data

  // Defensa en profundidad: las RLS de `quotes` ya filtran por estudio, pero
  // `/api/**` queda fuera del matcher de `proxy.ts` — así esta ruta no depende
  // de una sola capa para no exponer datos del cliente (nombre, teléfono, email).
  const studio = await getCurrentStudio()
  if (!studio || q.studio_id !== studio.id) {
    return new Response('No encontrada', { status: 404 })
  }

  const supabase = await createClient()
  const publicUrl = (path: string) => supabase.storage.from('quote-photos').getPublicUrl(path).data.publicUrl
  const photoUrl = q.reference_photo_path ? publicUrl(q.reference_photo_path) : null
  const referencePhotos = [q.reference_photo_path, ...(q.extra_photo_paths ?? [])]
    .filter((p): p is string => Boolean(p))
    .map(publicUrl)

  const data = buildQuoteTemplateData(q, studio, photoUrl, referencePhotos)
  const platformMarkUrl = new URL('/brand/pulpo-blanco.png', req.url).toString()
  const qrDataUrl = await generateQr(data.waLink, data.templateColor)

  // Todas las validaciones en paralelo — cada una es un HEAD liviano.
  const [safePhotoUrl, safeReferencePhotos, safeLogoUrl] = await Promise.all([
    safeImageUrl(data.photoUrl),
    Promise.all(data.referencePhotos.map((url) => safeImageUrl(url))).then(
      (urls) => urls.filter((u): u is string => Boolean(u))
    ),
    safeImageUrl(data.studioLogoUrl),
  ])
  data.photoUrl = safePhotoUrl
  data.referencePhotos = safeReferencePhotos
  data.studioLogoUrl = safeLogoUrl

  const headers = { 'Content-Type': 'image/png' }

  try {
    const buffer = await renderPng(
      <QuoteOgImage data={data} qrDataUrl={qrDataUrl} platformMarkUrl={platformMarkUrl} />,
      1080,
      2480
    )
    return new Response(buffer, { headers })
  } catch (renderError) {
    console.error('No se pudo generar la imagen premium de la cotización, usando respaldo', renderError)
  }

  // Respaldo: sin fotos remotas ni CSS avanzado — casi imposible que falle.
  // La persona siempre recibe una imagen, aunque sea la simple.
  try {
    const buffer = await renderPng(<QuoteOgImageFallback data={data} />, 1080, 900)
    return new Response(buffer, { headers })
  } catch (fallbackError) {
    console.error('Tampoco se pudo generar la imagen de respaldo de la cotización', fallbackError)
    return new Response('No se pudo generar la imagen', { status: 500 })
  }
}
