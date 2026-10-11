import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseWebhook } from '@/lib/whatsapp-cloud/parse'
import { ingestInbound, ingestStatuses } from '@/lib/whatsapp-cloud/ingest'

/**
 * Webhook de la WhatsApp Cloud API (una sola app de Meta para toda la
 * plataforma; cada estudio se reconoce por su `phone_number_id`).
 *
 *  GET  → verificación al configurar el webhook en developers.facebook.com
 *         (compara `hub.verify_token` con WHATSAPP_VERIFY_TOKEN).
 *  POST → mensajes entrantes y estados (enviado/entregado/leído). Se valida
 *         la firma `X-Hub-Signature-256` con WHATSAPP_APP_SECRET.
 */

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const expected = process.env.WHATSAPP_VERIFY_TOKEN
  if (
    expected &&
    params.get('hub.mode') === 'subscribe' &&
    params.get('hub.verify_token') === expected
  ) {
    return new NextResponse(params.get('hub.challenge') ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

function validSignature(raw: string, header: string | null, secret: string) {
  if (!header?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', secret).update(raw).digest()
  const received = Buffer.from(header.slice('sha256='.length), 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function POST(request: NextRequest) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) {
    console.error('[whatsapp] Falta WHATSAPP_APP_SECRET: webhook rechazado')
    return new NextResponse('Not configured', { status: 503 })
  }

  const raw = await request.text()
  if (!validSignature(raw, request.headers.get('x-hub-signature-256'), secret)) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }

  const { messages, statuses } = parseWebhook(payload)
  try {
    const admin = createAdminClient()
    await ingestInbound(admin, messages)
    await ingestStatuses(admin, statuses)
  } catch (e) {
    // 500 → Meta reintenta; los duplicados se descartan por wa_message_id.
    console.error('[whatsapp] Error procesando webhook', e)
    return new NextResponse('Error', { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
