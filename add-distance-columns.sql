-- Script untuk menambahkan kolom odometer dan jarak ke tabel fuel_records yang sudah ada
-- Jalankan script ini jika Anda sudah memiliki tabel fuel_records tanpa kolom odometer_km, distance_km dan cost_per_km

-- Tambah kolom odometer_km
ALTER TABLE fuel_records 
ADD COLUMN IF NOT EXISTS odometer_km DECIMAL(10,2) DEFAULT 0;

-- Tambah kolom distance_km
ALTER TABLE fuel_records 
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2) DEFAULT 0;

-- Tambah kolom cost_per_km
ALTER TABLE fuel_records 
ADD COLUMN IF NOT EXISTS cost_per_km DECIMAL(10,2) DEFAULT 0;

-- Update cost_per_km untuk data yang sudah ada (jika distance_km > 0)
UPDATE fuel_records 
SET cost_per_km = CASE 
  WHEN distance_km > 0 THEN total_cost / distance_km 
  ELSE 0 
END
WHERE cost_per_km = 0;

-- Verifikasi perubahan
SELECT 
  'Columns added successfully' as status,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'fuel_records' 
AND column_name IN ('odometer_km', 'distance_km', 'cost_per_km'); 