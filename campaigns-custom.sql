-- Campañas creadas desde la app ("Crear campaña"). Cada una usa una
-- plantilla de WhatsApp (comodín, una aprobada o una nueva que se manda a
-- revisión) y una lista fija de clientes elegida al crearla.
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  -- Plantilla de Meta y sus variables: {{1}} es siempre el nombre; params
  -- trae {{2}}, {{3}}… en orden.
  template_name text not null,
  template_language text not null default 'es',
  params text[] not null default '{}',
  -- Imagen del encabezado (URL pública) si la plantilla la lleva.
  image_url text,
  -- Texto que queda en el chat (con {{1}} sin reemplazar) y botones.
  body_preview text not null,
  buttons text[] not null default '{}',
  client_ids uuid[] not null default '{}',
  -- awaiting_template → (aprobada) scheduled → sending → sent | cancelled
  status text not null default 'scheduled'
    check (status in ('awaiting_template', 'draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  -- Avance del envío por tandas: índice en client_ids.
  cursor integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  locked_until timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (studio_id, name)
);

create index if not exists campaigns_due_idx on public.campaigns (status, scheduled_at);

alter table public.campaigns enable row level security;

drop policy if exists campaigns_owner_all on public.campaigns;
create policy campaigns_owner_all on public.campaigns
  for all to authenticated
  using (studio_id = public.get_studio_id() and public.is_owner())
  with check (studio_id = public.get_studio_id() and public.is_owner());

-- Imágenes de campañas: públicas (Meta las descarga al enviar). Se suben
-- desde el servidor con la service role.
insert into storage.buckets (id, name, public)
values ('campaign-images', 'campaign-images', true)
on conflict (id) do nothing;

-- Procesa campañas programadas cada 5 minutos (tandas de 250).
select cron.schedule(
  'campaigns-custom',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://www.crisbotattoo.com/api/cron/campaign',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'campaign_cron_secret')
    ),
    body := jsonb_build_object('kind', 'custom'),
    timeout_milliseconds := 10000
  );
  $$
);
