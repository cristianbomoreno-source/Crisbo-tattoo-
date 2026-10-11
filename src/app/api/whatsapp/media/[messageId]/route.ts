import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { downloadMedia } from '@/lib/whatsapp-cloud/api'

/** Proxy de fotos/audios de WhatsApp: las URLs de Meta exigen el token del
 * estudio y caducan, así que el navegador pide aquí y nosotros descargamos.
 * El select con el cliente de usuario hace que RLS verifique que el mensaje
 * es del estudio activo. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params

  const supabase = await createClient()
  const { data: message } = await supabase
    .from('wa_messages')
    .select('studio_id, media_id, media_mime')
    .eq('id', messageId)
    .maybeSingle()
  if (!message?.media_id) return new NextResponse('Not found', { status: 404 })

  const { data: account } = await createAdminClient()
    .from('whatsapp_accounts')
    .select('access_token')
    .eq('studio_id', message.studio_id)
    .maybeSingle()
  if (!account) return new NextResponse('Not connected', { status: 404 })

  try {
    const media = await downloadMedia(message.media_id, account.access_token)
    return new NextResponse(media.body, {
      headers: {
        'Content-Type': message.media_mime || media.mime,
        // Privado: es contenido del cliente, no se cachea en CDN.
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (e) {
    console.error('[whatsapp] Error descargando media', e)
    return new NextResponse('Media unavailable', { status: 502 })
  }
}
