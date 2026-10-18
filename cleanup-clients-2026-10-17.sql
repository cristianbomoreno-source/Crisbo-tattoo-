-- 2026-10-17: borrado de contactos basura (un solo nombre/letra, o con tío/tía, cuñado, don/doña).
-- Solo los que no tenían proyectos, cotizaciones ni consentimientos. 384 borrados, 1.624 quedan.
-- Respaldo completo en public.clients_deleted_backup (para restaurar: insert into clients select <columnas> from clients_deleted_backup).
create table if not exists public.clients_deleted_backup as select *, now() as deleted_at from public.clients where false;
alter table public.clients_deleted_backup enable row level security;
with target as (
  select c.id from clients c
  where c.studio_id = '809b00a6-5040-43a8-a735-ab306fe5c163'
    and (btrim(c.name) !~ '\s'
      or lower(c.name) ~ '(^|[^a-záéíóúñ])(t[ií]o|t[ií]a|cuñad[oa]s?|don|doña|dona)([^a-záéíóúñ]|$)')
    and not exists (select 1 from projects p where p.client_id=c.id)
    and not exists (select 1 from quotes q where q.client_id=c.id)
    and not exists (select 1 from consents x where x.client_id=c.id)
), bk as (
  insert into clients_deleted_backup select c.*, now() from clients c where c.id in (select id from target) returning id
)
delete from clients where id in (select id from bk);

-- Segunda pasada: los que contienen primo/prima (13 borrados, mismo respaldo).
with target as (
  select c.id from clients c where c.studio_id='809b00a6-5040-43a8-a735-ab306fe5c163'
  and lower(c.name) ~ '(^|[^a-záéíóúñ])prim[oa]s?([^a-záéíóúñ]|$)'
  and not exists (select 1 from projects p where p.client_id=c.id)
  and not exists (select 1 from quotes q where q.client_id=c.id)
  and not exists (select 1 from consents x where x.client_id=c.id)
), bk as (insert into clients_deleted_backup select c.*, now() from clients c where c.id in (select id from target) returning id)
delete from clients where id in (select id from bk);
