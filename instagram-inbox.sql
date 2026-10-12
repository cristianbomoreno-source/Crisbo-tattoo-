-- Instagram en la bandeja de Mensajes
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/fqldfexsbvykwcmeppja/sql/new
--
-- Los chats de Instagram usan las mismas tablas que WhatsApp
-- (wa_conversations / wa_messages) con `channel = 'instagram'`; en `wa_id`
-- va el IGSID del cliente (id que Instagram asigna a quien escribe). Los
-- IGSID y los números de teléfono no se pisan dentro de UNIQUE (studio_id, wa_id).

-- 1. Cuenta de Instagram por estudio (token solo para el service role) --------
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL UNIQUE REFERENCES studios(id) ON DELETE CASCADE,
  ig_user_id text NOT NULL UNIQUE,           -- id de la cuenta profesional (entry.id del webhook)
  username text,
  access_token text NOT NULL,                -- token de larga duración (60 días, se renueva solo)
  token_refreshed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
-- Sin políticas a propósito: anon/authenticated no pueden leer el token.

-- 2. Canal de cada conversación ------------------------------------------------
ALTER TABLE wa_conversations
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram')),
  ADD COLUMN IF NOT EXISTS ig_username text;
CREATE INDEX IF NOT EXISTS wa_conversations_channel_idx ON wa_conversations (studio_id, channel);
