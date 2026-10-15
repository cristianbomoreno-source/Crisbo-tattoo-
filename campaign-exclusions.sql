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
