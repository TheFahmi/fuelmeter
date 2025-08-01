-- Script untuk memperbaiki RLS policy user_settings
-- Jalankan script ini jika ada error RLS saat menyimpan user_settings

-- Hapus policy yang mungkin bermasalah
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Buat ulang policy yang benar
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Buat atau update trigger untuk auto-set user_id
CREATE OR REPLACE FUNCTION handle_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger yang mungkin sudah ada
DROP TRIGGER IF EXISTS on_user_settings_created ON user_settings;

-- Buat trigger baru
CREATE TRIGGER on_user_settings_created
  BEFORE INSERT ON user_settings
  FOR EACH ROW EXECUTE PROCEDURE handle_user_settings();

-- Verifikasi policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_settings';

-- Test insert (akan gagal jika RLS masih bermasalah)
-- INSERT INTO user_settings (initial_odometer) VALUES (1000); 