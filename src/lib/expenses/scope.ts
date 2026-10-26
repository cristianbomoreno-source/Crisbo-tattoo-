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
