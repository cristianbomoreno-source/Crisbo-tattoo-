/** Nota que se agrega a la cotización cuando el nombre escrito en el intake
 * difiere del nombre ya guardado para el cliente (vinculado por teléfono en el
 * dedupe). El cliente existente NUNCA se renombra; esto solo avisa al tatuador.
 * Comparación insensible a mayúsculas y espacios. `null` si son el mismo nombre. */
export function buildNameMismatchNote(
  existingName: string,
  submittedName: string
): string | null {
  if (existingName.trim().toLowerCase() === submittedName.trim().toLowerCase()) return null
  return `El cliente escribió su nombre como: ${submittedName}`
}
