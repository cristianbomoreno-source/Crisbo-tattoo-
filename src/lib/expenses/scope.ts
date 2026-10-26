/** Gastos personales: se guardan en la misma tabla `expenses` con la
 * categoría prefijada ("Personal · Comida"), así no hace falta otra columna.
 * Finanzas los separa de los costos del estudio: son plata del negocio que
 * salió para el dueño, no un costo de operar. */
export const PERSONAL_PREFIX = 'Personal · '

export function isPersonalExpense(category: string) {
  return category.startsWith(PERSONAL_PREFIX)
}

export function personalCategory(category: string) {
  return `${PERSONAL_PREFIX}${category}`.slice(0, 40)
}

export function stripPersonalPrefix(category: string) {
  return isPersonalExpense(category) ? category.slice(PERSONAL_PREFIX.length) : category
}

/** Ingresos que no son de un proyecto (abono de una cita nueva, venta de
 * producto…) registrados desde el atajo. Sin tabla propia: van en `expenses`
 * con este prefijo y Finanzas los suma a lo cobrado, no a los gastos. */
export const OTHER_INCOME_PREFIX = 'Ingreso · '
export const OTHER_INCOME_OPTIONS = ['Abono de cita nueva', 'Venta de producto', 'Otro ingreso']

export function isOtherIncome(category: string) {
  return category.startsWith(OTHER_INCOME_PREFIX)
}

/** Saldo real de una cuenta que el dueño escribe en el Resumen de caja
 * ("Saldo · Nequi"). Es un punto de corte, no un gasto: desde ahí el saldo
 * sigue con lo que se registre después. `getExpenses` lo excluye. */
export const BALANCE_PREFIX = 'Saldo · '

export function isBalanceSnapshot(category: string) {
  return category.startsWith(BALANCE_PREFIX)
}

/** Movimientos de una cuenta que no son ventas ni gastos (Resumen de caja →
 * libro de la cuenta): plata que entró sin ser venta ("Entrada · Cadena"),
 * plata que salió sin clasificar ("Salida · A 3202107769") y traslados entre
 * cuentas propias ("Transferencia · Efectivo", cuenta de origen en la
 * descripción). Mueven el saldo de la cuenta pero Finanzas y Gastos no los
 * cuentan; `getExpenses` los excluye. */
export const MOVE_IN_PREFIX = 'Entrada · '
export const MOVE_OUT_PREFIX = 'Salida · '
export const TRANSFER_PREFIX = 'Transferencia · '
export const LEDGER_ONLY_PREFIXES = [BALANCE_PREFIX, MOVE_IN_PREFIX, MOVE_OUT_PREFIX, TRANSFER_PREFIX]

export function isLedgerOnly(category: string) {
  return LEDGER_ONLY_PREFIXES.some((p) => category.startsWith(p))
}
