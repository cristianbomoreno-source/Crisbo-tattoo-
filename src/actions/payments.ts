'use server'

import { createClient } from '@/lib/supabase/server'
import { ok, err, type Result } from '@/lib/errors/types'
import { dbError } from '@/lib/errors/db'
import { createPaymentSchema } from '@/lib/validations/payments'
import { cop } from '@/lib/projects/metrics'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updatePaymentDateSchema = z.object({
  payment_id: z.string().uuid(),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
})

const deletePaymentSchema = z.object({
  payment_id: z.string().uuid(),
})

async function getStudioId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('artists').select('studio_id').single()
  return data?.studio_id ?? null
}

/** Registra un pago (parcial o final, según el saldo restante). */
export async function createPaymentAction(input: unknown): Promise<Result<void>> {
  const parsed = createPaymentSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const studioId = await getStudioId()
  if (!studioId) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()

  // El tipo depende del saldo restante: cubre el total → final, si no → partial.
  const { data } = await supabase
    .from('projects')
    .select('total_value, payments(amount)')
    .eq('id', parsed.data.project_id)
    .single()
  const project = data as
    | { total_value: number | null; payments: { amount: number }[] }
    | null

  // RLS: si no es visible, no existe o pertenece a otro estudio.
  if (!project) return err('NOT_FOUND', 'Proyecto no encontrado')

  const totalValue = project?.total_value ?? 0
  const paid = (project?.payments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
  const remaining = totalValue - paid

  // No aceptar pagos que excedan el saldo (dejaría saldo negativo en la UI).
  if (totalValue > 0 && parsed.data.amount > remaining)
    return err(
      'VALIDATION_ERROR',
      `El pago supera el saldo pendiente (${cop(Math.max(remaining, 0))}).`
    )

  const type =
    remaining > 0 && parsed.data.amount >= remaining ? 'final' : 'partial'

  // Si el pago se liga a una sesión, verificar que sea del mismo proyecto (RLS
  // ya aísla por estudio; esto evita ligar un pago a una sesión de otro proyecto).
  if (parsed.data.session_id) {
    const { data: sess } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', parsed.data.session_id)
      .eq('project_id', parsed.data.project_id)
      .maybeSingle()
    if (!sess) return err('VALIDATION_ERROR', 'La sesión no pertenece a este proyecto')
  }

  const { error } = await supabase.from('payments').insert({
    studio_id: studioId,
    project_id: parsed.data.project_id,
    session_id: parsed.data.session_id ?? null,
    amount: parsed.data.amount,
    type,
    payment_method: parsed.data.payment_method ?? null,
    notes: parsed.data.notes ?? null,
  })
  if (error) return dbError(error)

  revalidatePath(`/dashboard/projects/${parsed.data.project_id}`)
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/finanzas')
  return ok(undefined)
}

/** Actualiza la fecha de pago (paid_at) de un pago existente. */
export async function updatePaymentDateAction(input: unknown): Promise<Result<void>> {
  const parsed = updatePaymentDateSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const studioId = await getStudioId()
  if (!studioId) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()

  // Verificar que el pago exista y pertenezca al estudio (RLS lo hace, pero validamos)
  const { data: payment } = await supabase
    .from('payments')
    .select('id, project_id')
    .eq('id', parsed.data.payment_id)
    .single()

  if (!payment) return err('NOT_FOUND', 'Pago no encontrado')

  const { error } = await supabase
    .from('payments')
    .update({ paid_at: parsed.data.paid_at })
    .eq('id', parsed.data.payment_id)

  if (error) return dbError(error)

  revalidatePath(`/dashboard/projects/${payment.project_id}`)
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  revalidatePath('/dashboard/settings/finanzas')
  return ok(undefined)
}

/** Elimina un pago existente. */
export async function deletePaymentAction(input: unknown): Promise<Result<void>> {
  const parsed = deletePaymentSchema.safeParse(input)
  if (!parsed.success) return err('VALIDATION_ERROR', 'Datos inválidos', parsed.error)

  const studioId = await getStudioId()
  if (!studioId) return err('AUTH_ERROR', 'No autenticado')

  const supabase = await createClient()

  // Obtener project_id antes de eliminar para revalidar rutas
  const { data: payment } = await supabase
    .from('payments')
    .select('id, project_id')
    .eq('id', parsed.data.payment_id)
    .single()

  if (!payment) return err('NOT_FOUND', 'Pago no encontrado')

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', parsed.data.payment_id)

  if (error) return dbError(error)

  revalidatePath(`/dashboard/projects/${payment.project_id}`)
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/stats')
  revalidatePath('/dashboard/settings/finanzas')
  return ok(undefined)
}
