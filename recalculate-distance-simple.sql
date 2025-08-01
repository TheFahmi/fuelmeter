-- Script sederhana untuk menghitung ulang jarak tempuh berdasarkan odometer
-- Jalankan script ini untuk mengupdate jarak tempuh dan biaya per km

-- Step 1: Reset jarak tempuh dan biaya per km
UPDATE fuel_records 
SET distance_km = 0, cost_per_km = 0;

-- Step 2: Update jarak tempuh berdasarkan selisih odometer
UPDATE fuel_records fr1
SET 
  distance_km = (
    SELECT 
      CASE 
        WHEN fr2.odometer_km IS NULL OR fr2.odometer_km = 0 THEN 0
        WHEN fr1.odometer_km >= fr2.odometer_km THEN fr1.odometer_km - fr2.odometer_km
        ELSE 0
      END
    FROM (
      SELECT 
        id,
        odometer_km,
        LAG(odometer_km) OVER (PARTITION BY user_id ORDER BY created_at) as prev_odometer
      FROM fuel_records
      WHERE odometer_km > 0
    ) fr2
    WHERE fr2.id = fr1.id
  )
WHERE fr1.odometer_km > 0;

-- Step 3: Update biaya per km
UPDATE fuel_records 
SET cost_per_km = CASE 
  WHEN distance_km > 0 THEN total_cost / distance_km
  ELSE 0
END
WHERE distance_km > 0;

-- Step 4: Verifikasi hasil
SELECT 
  date,
  fuel_type,
  odometer_km,
  distance_km,
  total_cost,
  ROUND(cost_per_km, 0) as cost_per_km,
  CASE 
    WHEN distance_km > 0 THEN 'OK'
    ELSE 'No distance'
  END as status
FROM fuel_records 
ORDER BY created_at DESC 
LIMIT 10; 