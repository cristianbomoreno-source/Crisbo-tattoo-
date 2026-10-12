-- Web Push: un registro por navegador/dispositivo suscrito (ver src/lib/push).
-- Aplicado en vivo el 2026-10-12. Llaves VAPID en Vercel:
-- NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES public.artists(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_studio_idx ON public.push_subscriptions(studio_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_artist_idx ON public.push_subscriptions(artist_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_subscriptions_select ON public.push_subscriptions FOR SELECT USING (studio_id = get_studio_id());
CREATE POLICY push_subscriptions_insert ON public.push_subscriptions FOR INSERT WITH CHECK (studio_id = get_studio_id() AND artist_id = get_artist_id());
CREATE POLICY push_subscriptions_update ON public.push_subscriptions FOR UPDATE USING (studio_id = get_studio_id()) WITH CHECK (studio_id = get_studio_id() AND artist_id = get_artist_id());
CREATE POLICY push_subscriptions_delete ON public.push_subscriptions FOR DELETE USING (studio_id = get_studio_id());

-- (2026-10-12) Buckets y columnas que el código ya usaba pero no existían en vivo:
-- logo y portada del estudio (Ajustes → Perfil) y fotos de la página de enlaces.
ALTER TABLE public.studios ADD COLUMN IF NOT EXISTS logo_path text;
ALTER TABLE public.studios ADD COLUMN IF NOT EXISTS cover_photo_path text;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('studio-logos', 'studio-logos', true, 2097152, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('studio-covers', 'studio-covers', true, 8388608, ARRAY['image/png','image/jpeg','image/webp']),
  ('link-page-photos', 'link-page-photos', true, 8388608, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- (2026-10-12) Página pública de enlaces (/l/<slug>, Ajustes → Enlace): tablas que
-- el código ya usaba pero no existían en vivo. Lectura pública vía service role.
ALTER TABLE public.studios ADD COLUMN IF NOT EXISTS description text;

CREATE TABLE IF NOT EXISTS public.studio_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  label text NOT NULL,
  subtitle text,
  url text NOT NULL,
  icon text NOT NULL DEFAULT 'link',
  color text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_links_studio_idx ON public.studio_links(studio_id, sort_order);
ALTER TABLE public.studio_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY studio_links_select ON public.studio_links FOR SELECT USING (studio_id = get_studio_id());
CREATE POLICY studio_links_insert ON public.studio_links FOR INSERT WITH CHECK (studio_id = get_studio_id() AND is_owner());
CREATE POLICY studio_links_update ON public.studio_links FOR UPDATE USING (studio_id = get_studio_id() AND is_owner()) WITH CHECK (studio_id = get_studio_id());
CREATE POLICY studio_links_delete ON public.studio_links FOR DELETE USING (studio_id = get_studio_id() AND is_owner());

CREATE TABLE IF NOT EXISTS public.studio_link_page (
  studio_id uuid PRIMARY KEY REFERENCES public.studios(id) ON DELETE CASCADE,
  profile_photo_url text,
  profile_photo_path text,
  cover_photo_url text,
  cover_photo_path text,
  display_name text,
  bio text,
  tagline text,
  badge_label text,
  location_label text,
  template text NOT NULL DEFAULT 'dark',
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.studio_link_page ENABLE ROW LEVEL SECURITY;
CREATE POLICY studio_link_page_select ON public.studio_link_page FOR SELECT USING (studio_id = get_studio_id());
CREATE POLICY studio_link_page_insert ON public.studio_link_page FOR INSERT WITH CHECK (studio_id = get_studio_id() AND is_owner());
CREATE POLICY studio_link_page_update ON public.studio_link_page FOR UPDATE USING (studio_id = get_studio_id() AND is_owner()) WITH CHECK (studio_id = get_studio_id());

-- (2026-10-12) Resto de tablas que el código usaba y no existían en vivo
-- (migración Supabase 20261012045548 "missing_app_tables").
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.tour_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL UNIQUE REFERENCES public.artists(id) ON DELETE CASCADE,
  tour_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tour_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY tour_progress_own ON public.tour_progress FOR ALL USING (artist_id = get_artist_id()) WITH CHECK (artist_id = get_artist_id());

CREATE TABLE IF NOT EXISTS public.artist_permissions (
  artist_id uuid PRIMARY KEY REFERENCES public.artists(id) ON DELETE CASCADE,
  can_create_appointments boolean NOT NULL DEFAULT true,
  can_move_appointments boolean NOT NULL DEFAULT true,
  can_cancel_sessions boolean NOT NULL DEFAULT false,
  can_create_clients boolean NOT NULL DEFAULT true,
  can_edit_clients boolean NOT NULL DEFAULT true,
  can_create_projects boolean NOT NULL DEFAULT true,
  can_edit_projects boolean NOT NULL DEFAULT true,
  can_delete_projects boolean NOT NULL DEFAULT false,
  can_modify_prices boolean NOT NULL DEFAULT false,
  can_edit_duration boolean NOT NULL DEFAULT true,
  can_block_schedule boolean NOT NULL DEFAULT false,
  can_respond_quotes boolean NOT NULL DEFAULT true,
  can_use_inventory boolean NOT NULL DEFAULT true,
  can_edit_inventory boolean NOT NULL DEFAULT false,
  can_create_inventory_categories boolean NOT NULL DEFAULT false,
  can_discount_materials boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.artist_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY artist_permissions_select ON public.artist_permissions FOR SELECT USING (
  artist_id = get_artist_id()
  OR (is_owner() AND EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.studio_id = get_studio_id()))
);
CREATE POLICY artist_permissions_owner_write ON public.artist_permissions FOR UPDATE USING (
  is_owner() AND EXISTS (SELECT 1 FROM public.artists a WHERE a.id = artist_id AND a.studio_id = get_studio_id())
);

CREATE TABLE IF NOT EXISTS public.session_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity numeric NOT NULL,
  unit_cost numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS session_materials_session_idx ON public.session_materials(session_id);
ALTER TABLE public.session_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY session_materials_studio ON public.session_materials FOR ALL USING (studio_id = get_studio_id()) WITH CHECK (studio_id = get_studio_id());

CREATE TABLE IF NOT EXISTS public.studio_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  invited_by_artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  invited_email text NOT NULL,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_invitations_studio_idx ON public.studio_invitations(studio_id);
CREATE INDEX IF NOT EXISTS studio_invitations_user_idx ON public.studio_invitations(invited_user_id);
ALTER TABLE public.studio_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY studio_invitations_select ON public.studio_invitations FOR SELECT USING (
  (studio_id = get_studio_id() AND is_owner()) OR invited_user_id = auth.uid()
);
CREATE POLICY studio_invitations_update ON public.studio_invitations FOR UPDATE USING (
  (studio_id = get_studio_id() AND is_owner()) OR invited_user_id = auth.uid()
);

CREATE TABLE IF NOT EXISTS public.studio_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  specialty text,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_join_requests_studio_idx ON public.studio_join_requests(studio_id);
ALTER TABLE public.studio_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY studio_join_requests_insert ON public.studio_join_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY studio_join_requests_select ON public.studio_join_requests FOR SELECT USING (
  user_id = auth.uid() OR (studio_id = get_studio_id() AND is_owner())
);
CREATE POLICY studio_join_requests_update ON public.studio_join_requests FOR UPDATE USING (studio_id = get_studio_id() AND is_owner());

CREATE TABLE IF NOT EXISTS public.feature_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id uuid REFERENCES public.studios(id) ON DELETE SET NULL,
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  feature_key text NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_key)
);
ALTER TABLE public.feature_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feature_feedback_own ON public.feature_feedback FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.studio_features (
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (studio_id, feature_key)
);
ALTER TABLE public.studio_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY studio_features_select ON public.studio_features FOR SELECT USING (studio_id = get_studio_id());

-- Solo servidor (service role): sin políticas = sin acceso para usuarios.
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_signups (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text,
  auth_provider text,
  device text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_signups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_attempts_identifier_idx ON public.auth_attempts(identifier, created_at);
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- (2026-10-12) Calificación de funciones eliminada de la app a pedido del usuario.
DROP TABLE IF EXISTS public.feature_feedback;
