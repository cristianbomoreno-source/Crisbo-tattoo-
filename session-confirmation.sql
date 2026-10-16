-- Confirmación de citas por WhatsApp (recordatorio 24 h antes). APLICADO en
-- producción el 2026-10-16 (migración session_confirmation). El envío lo hace
-- el job de pg_cron 'recordatorios-citas' (ver abajo).
alter table public.sessions
  add column if not exists confirmation text check (confirmation in ('pending','confirmed','cancelled')),
  add column if not exists confirmation_at timestamptz,
  add column if not exists confirmation_followup_at timestamptz;

-- 2026-10-16: reminder_sent_at estaba en los tipos pero no en la base (el
-- cron de recordatorios y reagendar fallaban). APLICADO (sessions_reminder_sent_at).
alter table public.sessions add column if not exists reminder_sent_at timestamptz;

-- select cron.schedule('recordatorios-citas', '* * * * *', $job$
--   select net.http_post(
--     url := 'https://www.crisbotattoo.com/api/cron/reminders',
--     headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'campaign_cron_secret')),
--     body := '{}'::jsonb, timeout_milliseconds := 30000);
-- $job$);
