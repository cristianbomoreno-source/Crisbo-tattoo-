-- Borrar clientes desde Campañas (X o selección). Solo el dueño, solo de su
-- estudio y solo clientes sin proyectos, cotizaciones ni consentimientos.
-- Cada borrado queda copiado en clients_deleted_backup para poder restaurarlo.
create or replace function public.delete_clients_with_backup(p_ids uuid[])
returns table (deleted uuid[], skipped uuid[])
language plpgsql security definer set search_path = public as $$
declare
  v_studio uuid := get_studio_id();
  v_ok uuid[];
begin
  if v_studio is null or not is_owner() then
    raise exception 'Solo el dueño del estudio puede borrar clientes';
  end if;
  select coalesce(array_agg(c.id), '{}') into v_ok from clients c
  where c.id = any(p_ids) and c.studio_id = v_studio
    and not exists (select 1 from projects p where p.client_id = c.id)
    and not exists (select 1 from quotes q where q.client_id = c.id)
    and not exists (select 1 from consents x where x.client_id = c.id);
  insert into clients_deleted_backup select c.*, now() from clients c where c.id = any(v_ok);
  delete from clients where id = any(v_ok);
  return query select v_ok, coalesce((select array_agg(i) from unnest(p_ids) i where not i = any(v_ok)), '{}');
end $$;
revoke all on function public.delete_clients_with_backup(uuid[]) from public, anon;
grant execute on function public.delete_clients_with_backup(uuid[]) to authenticated;
