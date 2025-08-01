-- Script untuk menghitung ulang jarak tempuh berdasarkan odometer
-- Jalankan script ini untuk mengupdate jarak tempuh dan biaya per km berdasarkan odometer

-- Update jarak tempuh berdasarkan selisih odometer
WITH odometer_diff AS (
  SELECT 
    id,
    odometer_km,
    LAG(odometer_km) OVER (PARTITION BY user_id ORDER BY created_at) as prev_odometer,
    total_cost
  FROM fuel_records 
  WHERE odometer_km > 0
  ORDER BY user_id, created_at
)
UPDATE fuel_records 
SET 
  distance_km = CASE 
    WHEN odometer_diff.prev_odometer IS NULL THEN 0
    WHEN odometer_diff.odometer_km >= odometer_diff.prev_odometer 
    THEN odometer_diff.odometer_km - odometer_diff.prev_odometer
    ELSE 0
  END,
  cost_per_km = CASE 
    WHEN odometer_diff.prev_odometer IS NULL THEN 0
    WHEN odometer_diff.odometer_km >= odometer_diff.prev_odometer 
    THEN odometer_diff.total_cost / (odometer_diff.odometer_km - odometer_diff.prev_odometer)
    ELSE 0
  END
FROM odometer_diff
WHERE fuel_records.id = odometer_diff.id;

-- Verifikasi hasil
SELECT 
  date,
  fuel_type,
  odometer_km,
  distance_km,
  total_cost,
  cost_per_km,
  CASE 
    WHEN distance_km > 0 THEN 'OK'
    ELSE 'No distance'
  END as status
FROM fuel_records 
ORDER BY created_at DESC 
LIMIT 10; 