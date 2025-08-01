-- Script untuk menambahkan tabel user_settings ke database yang sudah ada
-- Jalankan script ini jika Anda sudah memiliki database tanpa tabel user_settings

-- Buat tabel user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  initial_odometer DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktifkan Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Hapus policy yang mungkin sudah ada
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Buat policy untuk user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Buat trigger untuk auto-set user_id
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

-- Verifikasi perubahan
SELECT 
  'User settings table created successfully' as status,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_name = 'user_settings';

SELECT 
  'RLS enabled' as status,
  rowsecurity as rls_status
FROM pg_tables 
WHERE tablename = 'user_settings'; 