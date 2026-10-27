/** Lee los SMS de movimientos de Nequi, Daviplata y Bold (Nu no manda SMS).
 * Formatos vistos (oct 2026):
 *  - "NEQUI: Pagaste 82.013,95 en GOOGLE*PLAY"                    → salió
 *  - "NEQUI: No te alcanzo para pagar 65.611,15 en …"             → ignorar (no pasó)
 *  - "NEQUI: Pagaste 0,00 en GOOGLE *TEMPORARY HOLD"              → ignorar (monto 0)
 *  - "DaviPlata: tu compra de $7,000 por codigo QR fue exitosa…"  → salió
 *  - "Recibiste $375,000. Para saber mas, consulta tus movimientos." (Daviplata) → entró
 *  - "Bold CF: Has recibido una transferencia por un valor de $373.809,96 …" → entró
 *  - "BoldCF: Realizaste una transferencia a traves de llaves por un valor de $375.000,00 …" → salió
 *  - "Bold CF: Has ingresado exitosamente a tu cuenta Bold."      → ignorar (inicio de sesión)
 *  - "Nequi: Tu negocio CRISBO TATTOO recibio $1.000 de NOMBRE  el 26/10/2026 a las 03:19 a.m. a través de Bre-B …" → entró (Nequi Negocios)
 *  - "Nu: Pagaste $45.900,00 en EXITO" → salió. No es un SMS: lo arma la
 *    automatización "Transacción" de Wallet (Apple Pay con la tarjeta Nu).
 * Cada banco separa miles y decimales distinto, ver parseAmount. */
/** comercio: dónde se pagó (gastos); pagador: quién mandó la plata (ingresos). */
export type SmsMovement = { income: boolean; amount: number; medio: string; comercio: string | null; pagador: string | null }

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** "82.013,95" → 82014 · "$7,000" → 7000 · "$375.000,00" → 375000 · "0,00" → 0.
 * El último separador es decimal solo si le siguen 1–2 dígitos; con 3 son miles. */
export function parseAmount(raw: string): number | null {
  const s = raw.replace(/[$\s]/g, '')
  if (!/^\d[\d.,]*$/.test(s)) return null
  const last = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','))
  const decimals = last >= 0 ? s.length - last - 1 : 0
  const value =
    last >= 0 && decimals > 0 && decimals <= 2
      ? Number(s.slice(0, last).replace(/[.,]/g, '') + '.' + s.slice(last + 1))
      : Number(s.replace(/[.,]/g, ''))
  return Number.isFinite(value) ? Math.round(value) : null
}

const IGNORE = [/no te alcanz/, /ingresado exitosamente/, /temporary hold/, /rechaz/, /codigo de (verificacion|seguridad)/, /\bclave\b/]
const INCOME = [/\brecibiste\b/, /\brecibio\b/,/has recibido/, /te (envio|envi[oó]|consigno|transfirio)/, /te llego/]
const EXPENSE = [/\bpagaste\b/, /compra de/, /realizaste una (transferencia|compra|pago)/, /\benviaste\b/, /transferiste/, /\bretiraste\b/, /retiro de/]

function bankOf(text: string) {
  if (/nequi/.test(text)) return 'Nequi'
  if (/bold/.test(text)) return 'Bold'
  if (/daviplata|para saber mas, consulta tus movimientos/.test(text)) return 'Daviplata'
  if (/\bnu\b|nubank/.test(text)) return 'Nu'
  return 'SMS'
}

export function parseBankSms(sms: string): SmsMovement | null {
  const text = plain(sms)
  if (IGNORE.some((r) => r.test(text))) return null
  const income = INCOME.some((r) => r.test(text))
  const expense = EXPENSE.some((r) => r.test(text))
  if (income === expense) return null

  // Primer número con forma de plata: "$375,000", "82.013,95", "$373.809,96".
  const match = sms.match(/\$?\s?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\$?\s?\d+(?:[.,]\d{1,2})?/)
  const amount = match ? parseAmount(match[0]) : null
  if (!amount || amount <= 0) return null

  const comercio = sms.match(/\ben\s+([^.\n]+?)(?:\s+\d{2}\/\d{2}\/\d{4}.*)?$/i)?.[1]?.trim() ?? null
  const pagador = income
    ? sms.match(/recib\w*\s+\$?\s?[\d.,]+\s+de\s+(.+?)(?:\s+el\s+\d|\s+a\s+trav|[.\n]|$)/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? null
    : null
  return {
    income,
    amount,
    medio: bankOf(text),
    comercio: expense && comercio && !/tu cuenta/i.test(comercio) ? comercio.slice(0, 60) : null,
    pagador: pagador ? pagador.slice(0, 60) : null,
  }
}
