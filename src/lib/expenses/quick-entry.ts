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

/** Error de validación en español para la notificación del atajo: si el
 * campo ni llegó (cuerpo JSON vacío o clave mal escrita), dice cuál falta. */
export function quickEntryIssue(issue: { path: PropertyKey[]; code: string; message: string } | undefined) {
  if (!issue) return '❌ Datos inválidos'
  const field = String(issue.path[0] ?? '')
  if (issue.code === 'invalid_type' && /undefined/.test(issue.message))
    return `❌ Falta el campo "${field}" en el Cuerpo de la solicitud (JSON)`
  return `❌ ${field ? field + ': ' : ''}${issue.message}`
}
