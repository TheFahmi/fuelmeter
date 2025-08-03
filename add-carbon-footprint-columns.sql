-- Migration script to add carbon footprint related columns to user_settings table
-- Run this script in Supabase SQL Editor

-- Add all missing columns to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS carbon_goal_kg DECIMAL(10,2) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'car',
ADD COLUMN IF NOT EXISTS fuel_efficiency_km_l DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS carbon_intensity_kg_co2_l DECIMAL(5,2) DEFAULT 2.31,
ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(10,2) DEFAULT 500000.00,
ADD COLUMN IF NOT EXISTS fuel_capacity DECIMAL(5,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS service_interval_days INTEGER DEFAULT 90;

-- Update existing records to have default values
UPDATE user_settings 
SET 
  carbon_goal_kg = COALESCE(carbon_goal_kg, 1000.00),
  vehicle_type = COALESCE(vehicle_type, 'car'),
  fuel_efficiency_km_l = COALESCE(fuel_efficiency_km_l, 10.00),
  carbon_intensity_kg_co2_l = COALESCE(carbon_intensity_kg_co2_l, 2.31),
  monthly_budget = COALESCE(monthly_budget, 500000.00),
  fuel_capacity = COALESCE(fuel_capacity, 50.00),
  service_interval_days = COALESCE(service_interval_days, 90)
WHERE carbon_goal_kg IS NULL 
   OR vehicle_type IS NULL 
   OR fuel_efficiency_km_l IS NULL 
   OR carbon_intensity_kg_co2_l IS NULL
   OR monthly_budget IS NULL
   OR fuel_capacity IS NULL
   OR service_interval_days IS NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data
SELECT 
  user_id,
  carbon_goal_kg,
  display_name,
  vehicle_type,
  fuel_efficiency_km_l,
  carbon_intensity_kg_co2_l
FROM user_settings 
LIMIT 5; 