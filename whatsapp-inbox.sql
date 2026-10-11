-- Bandeja de WhatsApp (CRM) — fase 1
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/fqldfexsbvykwcmeppja/sql/new
--
-- Modelo:
--   whatsapp_accounts  → 1 número de WhatsApp Cloud API por estudio. Guarda el
--                        token de Meta: SOLO el service role la lee (RLS sin
--                        políticas), la app la toca desde server actions.
--   wa_conversations   → 1 por (estudio, número del cliente). Se vincula a un
--                        `clients` cuando el teléfono coincide.
--   wa_messages        → mensajes entrantes/salientes. El webhook de Meta los
--                        inserta con el service role; el equipo del estudio
--                        los lee con RLS (y por Realtime).

-- 1. Cuentas de WhatsApp por estudio ------------------------------------------
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL UNIQUE REFERENCES studios(id) ON DELETE CASCADE,
  phone_number_id text NOT NULL UNIQUE,
  waba_id text NOT NULL,
  access_token text NOT NULL,
  display_phone text,
  verified_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
-- Sin políticas a propósito: anon/authenticated no pueden leer el token.

-- 2. Conversaciones -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  wa_id text NOT NULL,                       -- número del cliente, solo dígitos (573001234567)
  contact_name text,                         -- nombre de perfil de WhatsApp
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  last_message_direction text CHECK (last_message_direction IN ('in', 'out')),
  last_inbound_at timestamptz,               -- abre la ventana de 24 h de Meta
  unread_count integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (studio_id, wa_id)
);
CREATE INDEX IF NOT EXISTS wa_conversations_studio_last_idx
  ON wa_conversations (studio_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS wa_conversations_client_idx ON wa_conversations (client_id);

ALTER TABLE wa_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Studio can view its conversations" ON wa_conversations;
DROP POLICY IF EXISTS "Studio can update its conversations" ON wa_conversations;
CREATE POLICY "Studio can view its conversations" ON wa_conversations
  FOR SELECT USING (studio_id = get_studio_id());
CREATE POLICY "Studio can update its conversations" ON wa_conversations
  FOR UPDATE USING (studio_id = get_studio_id()) WITH CHECK (studio_id = get_studio_id());

-- 3. Mensajes ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  wa_message_id text UNIQUE,                 -- id de Meta (wamid.…), para deduplicar y casar estados
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  type text NOT NULL DEFAULT 'text',         -- text | image | audio | video | document | sticker | location | template | reaction | unsupported
  body text,
  media_id text,
  media_mime text,
  media_filename text,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'sending', 'sent', 'delivered', 'read', 'failed')),
  error text,
  sent_by uuid REFERENCES artists(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wa_messages_conversation_idx ON wa_messages (conversation_id, created_at);

ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Studio can view its messages" ON wa_messages;
CREATE POLICY "Studio can view its messages" ON wa_messages
  FOR SELECT USING (studio_id = get_studio_id());

-- 4. Realtime: la bandeja se actualiza sola al llegar mensajes ------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'wa_conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wa_conversations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'wa_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wa_messages;
  END IF;
END $$;

-- 4. Formulario de datos (WhatsApp Flow + plantilla) — fase 2 -----------------
-- El Flow pide nombre completo, celular, correo y fecha de nacimiento; la
-- plantilla (aprobada por Meta) lo envía con un botón, incluso fuera de 24 h.
ALTER TABLE whatsapp_accounts
  ADD COLUMN IF NOT EXISTS form_flow_id text,
  ADD COLUMN IF NOT EXISTS form_template_name text,
  ADD COLUMN IF NOT EXISTS form_template_status text,   -- PENDING | APPROVED | REJECTED | PAUSED | DISABLED
  ADD COLUMN IF NOT EXISTS form_template_reason text;
