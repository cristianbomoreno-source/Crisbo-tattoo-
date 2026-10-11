/** Datos mínimos del proyecto que necesita el calendario para saber si ya se
 * pagó todo (vienen embebidos en la sesión: `projects(total_value, payments(amount))`). */
export type ProjectPaymentInfo = {
  total_value?: number | null
  payments?: { amount: number | null }[] | null
} | null

/** El proyecto de la sesión está pagado por completo: tiene un valor total
 * y la suma de sus pagos lo cubre. Sin valor total no se marca como pagado. */
export function isProjectFullyPaid(project: ProjectPaymentInfo | undefined): boolean {
  const total = Number(project?.total_value ?? 0)
  if (!(total > 0)) return false
  const paid = (project?.payments ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
  return paid >= total
}
