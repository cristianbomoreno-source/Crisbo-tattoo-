-- Consentimiento por cita: pg_cron cada minuto llama al endpoint (más
-- preciso que GitHub Actions). Usa el mismo secreto del Vault que la campaña
-- (campaign_cron_secret = CRON_SECRET de Vercel). Pendiente de aplicar: el
-- MCP de Supabase rechazó la operación el 2026-10-16.
select cron.schedule('consentimientos-whatsapp', '* * * * *', $job$
  select net.http_post(
    url := 'https://www.crisbotattoo.com/api/cron/consents',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'campaign_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$job$);
