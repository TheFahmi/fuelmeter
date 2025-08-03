-- Migration script to add station column to fuel_records table
-- Run this script in Supabase SQL Editor

-- Add station column to fuel_records table
ALTER TABLE fuel_records 
ADD COLUMN IF NOT EXISTS station TEXT;

-- Update existing records to have a default station value
UPDATE fuel_records 
SET station = COALESCE(station, 'Unknown Station')
WHERE station IS NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'fuel_records' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data with station column
SELECT 
  id,
  date,
  fuel_type,
  quantity,
  price_per_liter,
  total_cost,
  station,
  created_at
FROM fuel_records 
LIMIT 5; 