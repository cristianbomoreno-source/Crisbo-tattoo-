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
