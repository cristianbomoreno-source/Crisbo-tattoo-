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
