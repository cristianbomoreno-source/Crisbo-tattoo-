import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

/** Auth y respuestas compartidas por los endpoints del atajo del iPhone
 * (`/api/movimiento`, `/api/quick-expense`): `Authorization: Bearer
 * QUICK_EXPENSE_TOKEN`, todo se guarda en el estudio QUICK_EXPENSE_STUDIO_ID. */
export function quickEntryAuthorized(req: Request) {
  const got = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const secret = process.env.QUICK_EXPENSE_TOKEN?.trim()
  if (!got || !secret || got.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(got), Buffer.from(secret))
}

export function quickEntryStudioId() {
  return process.env.QUICK_EXPENSE_STUDIO_ID?.trim() || null
}

/** Texto plano: el atajo lo muestra tal cual o lo divide por renglones. */
export const plainText = (body: string, status = 200) =>
  new NextResponse(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } })
