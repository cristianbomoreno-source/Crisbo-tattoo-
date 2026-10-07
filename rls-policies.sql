-- Políticas RLS para Crisbo Tattoo
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/fqldfexsbvykwcmeppja/sql/new

-- Habilitar RLS en todas las tablas
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blocked_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;

-- 1. Sessions
DROP POLICY IF EXISTS "Artists can view their sessions" ON sessions;
DROP POLICY IF EXISTS "Artists can manage their sessions" ON sessions;
CREATE POLICY "Artists can view their sessions" ON sessions
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their sessions" ON sessions
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));

-- 2. Projects
DROP POLICY IF EXISTS "Artists can view their projects" ON projects;
DROP POLICY IF EXISTS "Artists can manage their projects" ON projects;
CREATE POLICY "Artists can view their projects" ON projects
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their projects" ON projects
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));

-- 3. Clients
DROP POLICY IF EXISTS "Artists can view their clients" ON clients;
DROP POLICY IF EXISTS "Artists can manage their clients" ON clients;
CREATE POLICY "Artists can view their clients" ON clients
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their clients" ON clients
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));

-- 4. Quotes
DROP POLICY IF EXISTS "Artists can view their quotes" ON quotes;
DROP POLICY IF EXISTS "Artists can manage their quotes" ON quotes;
CREATE POLICY "Artists can view their quotes" ON quotes
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their quotes" ON quotes
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));

-- 5. Consents
DROP POLICY IF EXISTS "Artists can view their consents" ON consents;
DROP POLICY IF EXISTS "Artists can manage their consents" ON consents;
CREATE POLICY "Artists can view their consents" ON consents
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their consents" ON consents
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));

-- 6. Blocked Days
DROP POLICY IF EXISTS "Artists can view their blocked days" ON blocked_days;
DROP POLICY IF EXISTS "Artists can manage their blocked days" ON blocked_days;
CREATE POLICY "Artists can view their blocked days" ON blocked_days
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their blocked days" ON blocked_days
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));

-- 7. Payments
DROP POLICY IF EXISTS "Artists can view their payments" ON payments;
DROP POLICY IF EXISTS "Artists can manage their payments" ON payments;
CREATE POLICY "Artists can view their payments" ON payments
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their payments" ON payments
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));

-- 8. Gallery
DROP POLICY IF EXISTS "Artists can view their gallery" ON gallery;
DROP POLICY IF EXISTS "Artists can manage their gallery" ON gallery;
CREATE POLICY "Artists can view their gallery" ON gallery
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their gallery" ON gallery
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));

-- 9. Appointments
DROP POLICY IF EXISTS "Artists can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Artists can manage their appointments" ON appointments;
CREATE POLICY "Artists can view their appointments" ON appointments
  FOR SELECT USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
CREATE POLICY "Artists can manage their appointments" ON appointments
  FOR ALL USING (artist_id IN (SELECT id FROM artists WHERE user_id = auth.uid()));
