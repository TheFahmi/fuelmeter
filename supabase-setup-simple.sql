-- FuelMeter Database Setup - Versi Sederhana
-- Jalankan script ini di Supabase SQL Editor

-- Buat tabel fuel_records
CREATE TABLE IF NOT EXISTS fuel_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fuel_type TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price_per_liter DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  odometer_km DECIMAL(10,2) DEFAULT 0,
  distance_km DECIMAL(10,2) DEFAULT 0,
  cost_per_km DECIMAL(10,2) DEFAULT 0,
  station TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktifkan Row Level Security
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk user hanya bisa akses data mereka sendiri
CREATE POLICY "Users can view own fuel records" ON fuel_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fuel records" ON fuel_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fuel records" ON fuel_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fuel records" ON fuel_records
  FOR DELETE USING (auth.uid() = user_id);

-- Buat trigger untuk auto-set user_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_fuel_record_created
  BEFORE INSERT ON fuel_records
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Buat tabel untuk menyimpan odometer awal user
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  initial_odometer DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat RLS untuk user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Buat trigger untuk auto-set user_id di user_settings
CREATE OR REPLACE FUNCTION handle_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_settings_created
  BEFORE INSERT ON user_settings
  FOR EACH ROW EXECUTE PROCEDURE handle_user_settings();

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_fuel_records_user_id ON fuel_records(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(date);
CREATE INDEX IF NOT EXISTS idx_fuel_records_created_at ON fuel_records(created_at);

-- Verifikasi setup
SELECT 'Database setup completed successfully!' as status; 