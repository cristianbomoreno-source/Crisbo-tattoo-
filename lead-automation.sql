-- Embudo automático de la bandeja (WhatsApp e Instagram comparten wa_conversations):
--  • Entra un mensaje del cliente → "Cotizando" (si estaba Nuevo, Perdido, o
--    Agendado pero ya sin cita pendiente). "Esperando abono" no se toca.
--  • Se agenda una cita para el cliente del chat (botón Agendar cita, calendario,
--    cotización o proyecto) → "Agendado" y se cierra el seguimiento.

-- ¿El cliente tiene una cita pendiente (de hoy en adelante, no cancelada ni terminada)?
create or replace function public.client_has_pending_session(p_client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_client is not null and exists (
    select 1 from sessions s join projects p on p.id = s.project_id
    where p.client_id = p_client
      and s.status not in ('cancelled', 'completed')
      -- scheduled_at guarda la hora de Bogotá como si fuera UTC.
      and s.scheduled_at >= date_trunc('day', (now() at time zone 'America/Bogota')) at time zone 'UTC'
  )
$$;

create or replace function public.wa_lead_on_inbound()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update wa_conversations c
     set lead_stage = 'cotizando', lead_stage_at = new.created_at
   where c.id = new.conversation_id
     and (
       c.lead_stage is null
       or c.lead_stage in ('nuevo', 'perdido')
       or (c.lead_stage = 'agendado' and not client_has_pending_session(c.client_id))
     );
  return new;
end $$;

drop trigger if exists wa_lead_on_inbound on public.wa_messages;
create trigger wa_lead_on_inbound
  after insert on public.wa_messages
  for each row when (new.direction = 'in')
  execute function public.wa_lead_on_inbound();

create or replace function public.wa_lead_on_session()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  if new.status in ('cancelled', 'completed') then return new; end if;
  select client_id into v_client from projects where id = new.project_id;
  if v_client is null then return new; end if;
  update wa_conversations
     set lead_stage = 'agendado', lead_stage_at = now(), follow_up_at = null
   where client_id = v_client and studio_id = new.studio_id
     and lead_stage is distinct from 'agendado';
  return new;
end $$;

drop trigger if exists wa_lead_on_session on public.sessions;
create trigger wa_lead_on_session
  after insert on public.sessions
  for each row execute function public.wa_lead_on_session();

-- Si cancelan la cita y no queda otra pendiente, el chat vuelve a "Cotizando".
create or replace function public.wa_lead_on_session_cancel()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_client uuid;
begin
  select client_id into v_client from projects where id = new.project_id;
  if v_client is null or client_has_pending_session(v_client) then return new; end if;
  update wa_conversations
     set lead_stage = 'cotizando', lead_stage_at = now()
   where client_id = v_client and studio_id = new.studio_id and lead_stage = 'agendado';
  return new;
end $$;

drop trigger if exists wa_lead_on_session_cancel on public.sessions;
create trigger wa_lead_on_session_cancel
  after update of status on public.sessions
  for each row when (new.status = 'cancelled' and old.status is distinct from 'cancelled')
  execute function public.wa_lead_on_session_cancel();

revoke all on function public.client_has_pending_session(uuid) from public, anon, authenticated;

-- Al aplicarlo (2026-10-17) se alinearon los chats existentes: 2 con cita
-- pendiente → Agendado y 74 "Nuevo" que ya habían escrito → Cotizando.
