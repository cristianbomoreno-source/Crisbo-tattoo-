import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseInstagramWebhook } from '@/lib/instagram/parse'
import { ingestInstagram } from '@/lib/instagram/ingest'

/**
 * Webhook de mensajes de Instagram (cada estudio se reconoce por el id de su
 * cuenta profesional, entry.id).
 *
 *  GET  → verificación al configurar el webhook en developers.facebook.com
 *         (hub.verify_token = INSTAGRAM_VERIFY_TOKEN, o WHATSAPP_VERIFY_TOKEN).
 *  POST → mensajes entrantes y ecos. Firma `X-Hub-Signature-256` con
 *         INSTAGRAM_APP_SECRET (o WHATSAPP_APP_SECRET si es la misma app).
 */

function verifyToken() {
  return process.env.INSTAGRAM_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const expected = verifyToken()
  if (
    expected &&
    params.get('hub.mode') === 'subscribe' &&
    params.get('hub.verify_token') === expected
  ) {
    return new NextResponse(params.get('hub.challenge') ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

function validSignature(raw: string, header: string | null, secrets: string[]) {
  if (!header?.startsWith('sha256=')) return false
  const received = Buffer.from(header.slice('sha256='.length), 'hex')
  return secrets.some((secret) => {
    const expected = createHmac('sha256', secret).update(raw).digest()
    return received.length === expected.length && timingSafeEqual(received, expected)
  })
}

export async function POST(request: NextRequest) {
  const secrets = [process.env.INSTAGRAM_APP_SECRET, process.env.WHATSAPP_APP_SECRET].filter(
    (s): s is string => Boolean(s)
  )
  if (secrets.length === 0) {
    console.error('[instagram] Falta INSTAGRAM_APP_SECRET: webhook rechazado')
    return new NextResponse('Not configured', { status: 503 })
  }

  const raw = await request.text()
  if (!validSignature(raw, request.headers.get('x-hub-signature-256'), secrets)) {
    // Casi siempre es INSTAGRAM_APP_SECRET equivocada (la de Instagram, no la de la app de Meta).
    console.error('[instagram] Firma inválida: revisa INSTAGRAM_APP_SECRET')
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }

  const events = parseInstagramWebhook(payload)
  console.log(`[instagram] webhook: ${events.length} evento(s)`)
  try {
    await ingestInstagram(createAdminClient(), events)
  } catch (e) {
    // 500 → Meta reintenta; los duplicados se descartan por wa_message_id.
    console.error('[instagram] Error procesando webhook', e)
    return new NextResponse('Error', { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
