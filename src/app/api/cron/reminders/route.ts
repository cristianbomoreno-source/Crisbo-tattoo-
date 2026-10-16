import { NextResponse } from 'next/server'
import { authorizedCron } from '@/lib/cron/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDueReminders } from '@/lib/appointments/send-reminders'

/** Recordatorios de cita por WhatsApp (24 h antes + aviso si no confirma).
 * Lo llama pg_cron cada minuto (job 'recordatorios-citas', ver
 * session-confirmation.sql). Idempotente. */
export const maxDuration = 60

async function run(req: Request) {
  if (!(await authorizedCron(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const res = await sendDueReminders(createAdminClient())
    if (res.reminders || res.followups || res.failed.length) console.log('[reminders-cron]', res)
    return NextResponse.json(res)
  } catch (e) {
    console.error('[reminders-cron]', (e as Error).message)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export const GET = run
export const POST = run
