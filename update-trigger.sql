-- Trigger untuk mengupdate jarak tempuh otomatis saat record diupdate
-- Jalankan script ini untuk memastikan jarak tempuh selalu akurat

-- Hapus trigger yang mungkin sudah ada
DROP TRIGGER IF EXISTS on_fuel_record_updated ON fuel_records;

-- Buat function untuk update jarak tempuh
CREATE OR REPLACE FUNCTION update_distance_on_edit()
RETURNS TRIGGER AS $$
DECLARE
  prev_odometer DECIMAL(10,2);
BEGIN
  -- Ambil odometer dari record sebelumnya (exclude current record)
  SELECT odometer_km INTO prev_odometer
  FROM fuel_records
  WHERE user_id = NEW.user_id 
    AND id != NEW.id
    AND created_at < NEW.created_at
  ORDER BY created_at DESC
  LIMIT 1;

  -- Update jarak tempuh dan biaya per km
  NEW.distance_km = CASE 
    WHEN prev_odometer IS NULL OR prev_odometer = 0 THEN 0
    WHEN NEW.odometer_km >= prev_odometer THEN NEW.odometer_km - prev_odometer
    ELSE 0
  END;

  NEW.cost_per_km = CASE 
    WHEN NEW.distance_km > 0 THEN NEW.total_cost / NEW.distance_km
    ELSE 0
  END;

  -- Update timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat trigger untuk UPDATE
CREATE TRIGGER on_fuel_record_updated
  BEFORE UPDATE ON fuel_records
  FOR EACH ROW EXECUTE PROCEDURE update_distance_on_edit();

-- Verifikasi trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_fuel_record_updated'; 