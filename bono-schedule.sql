-- Envío programado del "Bono de agradecimiento": domingo 2026-10-18 desde las
-- 10:00 a. m. (Colombia) = 15:00 UTC, una tanda de 250 cada 10 minutos hasta
-- las 10:50 (874 clientes pendientes al programarlo). Cada tanda toma solo a
-- quienes siguen sin recibirlo: a nadie le llega dos veces. A las 12:00 se
-- borran los dos jobs (si no, se repetirían el 18 de octubre del otro año).
select cron.schedule(
  'bono-agradecimiento',
  '0,10,20,30,40,50 15 18 10 *',
  $$
  select net.http_post(
    url := 'https://www.crisbotattoo.com/api/cron/campaign',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'campaign_cron_secret')
    ),
    body := jsonb_build_object('studioId', '809b00a6-5040-43a8-a735-ab306fe5c163', 'kind', 'bono'),
    timeout_milliseconds := 10000
  );
  $$
);

select cron.schedule(
  'bono-agradecimiento-limpieza',
  '0 17 18 10 *',
  $$ select cron.unschedule('bono-agradecimiento'); select cron.unschedule('bono-agradecimiento-limpieza'); $$
);
