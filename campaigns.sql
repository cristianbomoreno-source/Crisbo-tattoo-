-- Campañas: clientes que el dueño quitó a mano de la lista (no reciben el envío).
-- Correr una vez en Supabase → SQL Editor.
create table if not exists public.campaign_exclusions (
  studio_id uuid not null references public.studios(id) on delete cascade,
  campaign text not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (studio_id, campaign, client_id)
);
alter table public.campaign_exclusions enable row level security;
drop policy if exists "campaign_exclusions_select" on public.campaign_exclusions;
drop policy if exists "campaign_exclusions_insert" on public.campaign_exclusions;
drop policy if exists "campaign_exclusions_delete" on public.campaign_exclusions;
create policy "campaign_exclusions_select" on public.campaign_exclusions
  for select using (studio_id = get_studio_id());
create policy "campaign_exclusions_insert" on public.campaign_exclusions
  for insert with check (studio_id = get_studio_id() and is_owner());
create policy "campaign_exclusions_delete" on public.campaign_exclusions
  for delete using (studio_id = get_studio_id() and is_owner());

-- Cupos tomados (pagaron el abono): el contador de la campaña.
create table if not exists public.campaign_slots (
  studio_id uuid not null references public.studios(id) on delete cascade,
  campaign text not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (studio_id, campaign, client_id)
);
alter table public.campaign_slots enable row level security;
drop policy if exists "campaign_slots_select" on public.campaign_slots;
drop policy if exists "campaign_slots_insert" on public.campaign_slots;
drop policy if exists "campaign_slots_delete" on public.campaign_slots;
create policy "campaign_slots_select" on public.campaign_slots
  for select using (studio_id = get_studio_id());
create policy "campaign_slots_insert" on public.campaign_slots
  for insert with check (studio_id = get_studio_id() and is_owner());
create policy "campaign_slots_delete" on public.campaign_slots
  for delete using (studio_id = get_studio_id() and is_owner());

-- Envío programado (aplicado el 2026-10-14). pg_cron corre en UTC: 16:00 UTC = 11:00 Colombia.
-- El secreto vive en el Vault ('campaign_cron_secret') y en Vercel (CRON_SECRET); deben ser iguales.
-- create extension if not exists pg_cron; create extension if not exists pg_net;
-- select vault.create_secret('<CRON_SECRET>', 'campaign_cron_secret');
-- select cron.schedule('nuevos-trazos-grupo-a', '0 16 15 10 *', $job$
--   select net.http_post(
--     url := 'https://www.crisbotattoo.com/api/cron/campaign',
--     headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
--       (select decrypted_secret from vault.decrypted_secrets where name = 'campaign_cron_secret')),
--     body := '{"studioId":"<studio_id>","group":"A"}'::jsonb, timeout_milliseconds := 30000);
--   select cron.unschedule('nuevos-trazos-grupo-a');
-- $job$);
-- (igual para el grupo B: 'nuevos-trazos-grupo-b', '0 16 17 10 *', "group":"B")
-- Ver tareas: select jobname, schedule from cron.job;  Cancelar: select cron.unschedule('<jobname>');
