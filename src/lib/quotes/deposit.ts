export type StudioDeposit = { mode: string | null; value: number | null }

const MIN_PERCENTAGE = 1
const MAX_PERCENTAGE = 100

function clampPercentage(n: number): number {
  return Math.min(MAX_PERCENTAGE, Math.max(MIN_PERCENTAGE, n))
}

/**
 * % de abono a aplicar a una cotización según el default del estudio
 * (`studios.deposit_mode`/`deposit_value`, configurado en el onboarding).
 *
 * - `mode: 'percent'` → el `value` tal cual (clamp 1..100), sin importar `price`.
 * - `mode: 'fixed'` → se convierte al % más cercano contra `price`:
 *   `clamp(round(value/price*100), 1, 100)`. Si `price` no es computable
 *   (0, NaN) o `value` <= 0, no se puede convertir de forma honesta.
 * - `mode` null/desconocido, o `deposit` null/undefined → sin config.
 *
 * `null` = no computable / no configurado — el caller debe usar el default
 * del sistema (schema `createQuoteSchema.deposit_percentage`), nunca inventar.
 */
export function depositPercentageFor(
  deposit: StudioDeposit | null | undefined,
  price: number
): number | null {
  if (!deposit || !deposit.mode) return null

  if (deposit.mode === 'percent') {
    if (deposit.value === null) return null
    return clampPercentage(deposit.value)
  }

  if (deposit.mode === 'fixed') {
    if (deposit.value === null || deposit.value <= 0) return null
    if (!Number.isFinite(price) || price <= 0) return null
    return clampPercentage(Math.round((deposit.value / price) * 100))
  }

  return null
}
