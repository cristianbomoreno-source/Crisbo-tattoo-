import { getPublicQuoteProject } from '@/queries/quote-links'
import { generateQr } from '@/lib/pdf/qr'
import { QuoteOgImage } from '@/lib/pdf/quote-og-image'
import { QuoteOgImageFallback } from '@/lib/pdf/quote-og-image-fallback'
import { safeImageUrl } from '@/lib/pdf/safe-image-url'
import { renderPng } from '@/lib/pdf/render-png'

export const maxDuration = 30

/** Imagen que WhatsApp (y cualquier crawler de Open Graph) muestra como
 * preview del link de proyecto — es lo único que reemplaza a la imagen que
 * antes se compartía a mano por WhatsApp; ahora la genera el propio link. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await getPublicQuoteProject(token)
  if (!result.success) return new Response('No encontrado', { status: 404 })
  const data = result.data.quote

  const platformMarkUrl = new URL('/brand/pulpo-blanco.png', req.url).toString()
  const qrDataUrl = await generateQr(data.waLink, data.templateColor)

  const [safePhotoUrl, safeReferencePhotos, safeLogoUrl] = await Promise.all([
    safeImageUrl(data.photoUrl),
    Promise.all(data.referencePhotos.map((url) => safeImageUrl(url))).then((urls) =>
      urls.filter((u): u is string => Boolean(u))
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
    console.error('No se pudo generar la imagen premium del proyecto, usando respaldo', renderError)
  }

  try {
    const buffer = await renderPng(<QuoteOgImageFallback data={data} />, 1080, 900)
    return new Response(buffer, { headers })
  } catch (fallbackError) {
    console.error('Tampoco se pudo generar la imagen de respaldo del proyecto', fallbackError)
    return new Response('No se pudo generar la imagen', { status: 500 })
  }
}
