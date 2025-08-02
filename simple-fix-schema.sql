-- Simple fix for missing columns in user_settings table
-- Run this in Supabase SQL Editor

-- Add missing columns one by one
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS fuel_capacity DECIMAL(10,2) DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(15,2) DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position; 