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

-- v2 (2026-10-17): solo pasa a "Cotizando" si el mensaje parece una consulta de
-- tatuaje (palabras clave). Ignora respuestas a historias, reels/publicaciones
-- compartidas y mensajes reenviados largos. Se devolvieron a "Nuevo" 58 chats
-- de amigos/proveedores que no habían preguntado por un tatuaje.
create or replace function public.is_tattoo_inquiry(p_text text)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(
    length(p_text) <= 600
    and p_text !~ '^(↩️ Respondió a tu historia|🎬 Compartió|🔗 Compartió|📣|🎁)'
    and translate(lower(p_text), 'áéíóúüñ', 'aeiouun') ~ (
      '(\mtatu|\mtatt?oo?|\mtatto|\mcotiz|\mprecio|cuanto (vale|cuesta|cobr|sale|seria|me sale|tendria|costaria)|que valor|cual (es|seria) el valor|\mpresupuesto|\mdiseno|\mboceto|\d+ ?cm\M|centimetro|\mantebrazo|\mbrazo\M|\mespalda\M|\mpierna\M|\mcostilla|\mpantorrilla|\mmuslo|\mhombro|\mpecho\M|\mcuello\M|\mmuneca\M|\mtobillo|\mclavicula|\momoplato|\mrealismo|fine ?line|\mlettering|\mminimalista|blanco y negro|\ma color\M|cover ?up|\mretoque|\magendar|\mdisponibilidad|\msesion|\mreferencia|\mhacerme\M|me quiero hacer|quisiera hacer|\mpiercing|\mcupo|\mpromo)'
    ), false)
$$;

create or replace function public.wa_lead_on_inbound()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_tattoo_inquiry(new.body) then return new; end if;
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

-- v3 (2026-10-17): lista completa de palabras clave. Generada desde
-- src/lib/whatsapp-cloud/tattoo-keywords.ts (tattooInquirySqlRegex) — si
-- cambias la lista allá, vuelve a generar y aplicar esta función.
create or replace function public.is_tattoo_inquiry(p_text text)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(
    length(p_text) <= 600
    and p_text !~ '^(↩️ Respondió a tu historia|🎬 Compartió|🔗 Compartió|📣|🎁)'
    and translate(lower(p_text), 'áéíóúüñ', 'aeiouun') ~ '(\ytatu|\ytatt?oo|\ytattos?\y|\ytinta\y|\ypieza\y|\ymanga\y|\ysleeve|\ymedia manga|brazo completo|pierna completa|espalda completa|\ycierre del brazo|\ycotiz|\yprecio|\yvalor del|\yque valor|\ycual (es|seria) el valor|\ycuanto (vale|cuesta|cobr|sale|saldria|seria|me sale|me saldria|tendria|costaria|me cobr|me costaria|valdria|esta)|\ycuanto por\y|\ypresupuesto|\ytarifa|\ycosto\y|\ycostaria|\ydescuento|\ypromo|\ypromocion|\ycupo|\ydiseno|\ydisenar|\yboceto|\ysketch|\ystencil|\yreferencia|\ytengo una idea|\ymi idea\y|\yuna idea\y|\yme quiero hacer|\yquiero hacerme|\yquisiera hacerme|\yquiero un\y.*\y(en el|en la)\y|\yhacerme (un|una|algo)|\yhacerme\y|\yme gustaria hacerme|\ypienso hacerme|\yme lo quiero hacer|\yiniciales\y|\yuna frase\y|\yun nombre\y|\yfecha de nacimiento|\d+ ?cm\y|\ycentimetro|\ypequeno\y.*\ytatu|\ytamano\y|\yantebrazo|\ybrazo\y|\ybicep|\ytricep|\yhombro|\yespalda\y|\ycolumna\y|\ynuca\y|\ycuello\y|\ypecho\y|\yesternon|\yabdomen|\yestomago|\ycadera|\ygluteo|\ynalga|\ypierna\y|\ymuslo|\yrodilla|\ypantorrilla|\ygemelo|\ycanilla|\ytobillo|\yempeine|\yen la mano\y|\ydedos?\y|\ymuneca\y|\ycodo\y|\ycostilla|\ycostado\y|\yclavicula|\yomoplato|\ydetras de la oreja|\yrealismo|\yrealista|\ymicro ?realismo|fine ?line|\ylinea fina|\yminimalista|\ytradicional|old ?school|\yneo ?tradicional|black ?work|\ydot ?work|\ypuntillismo|\ygeometric|\yacuarela|\ylettering|\yletras\y|\ycaligrafia|\ytribal|\yjapones|\yoriental|\ychicano|\ysombread|\ysombras\y|\ymandala|\yanime\y|trash ?polka|\ybiomecanic|\yornamental|blanco y negro|\ya color\y|\yen color\y|\ya full color|\ysolo linea|cover ?up|\ycubrir\y|\ytapar\y|\yretoque|\yrepasar|\yrellenar|\yarreglar (un|mi) tatu|\yagendar|\yagenda\y|\ydisponibilidad|\yespacio para|\yseparar (cita|un espacio|fecha)|\ysacar (una )?cita|\yuna cita\y|\ysesion|\ycuanto (tiempo )?(se )?demora|\ycuantas horas|\ypiercing|\yperforacion)',
    false)
$$;
