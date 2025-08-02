-- Fix currency column issue in user_settings table
-- This script will safely add the missing columns

-- First, check if columns exist and add them if they don't
DO $$ 
BEGIN
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'display_name') THEN
        ALTER TABLE user_settings ADD COLUMN display_name TEXT;
    END IF;

    -- Add vehicle_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'vehicle_type') THEN
        ALTER TABLE user_settings ADD COLUMN vehicle_type TEXT;
    END IF;

    -- Add fuel_capacity column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'fuel_capacity') THEN
        ALTER TABLE user_settings ADD COLUMN fuel_capacity DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add monthly_budget column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'monthly_budget') THEN
        ALTER TABLE user_settings ADD COLUMN monthly_budget DECIMAL(15,2) DEFAULT 0;
    END IF;

    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'currency') THEN
        ALTER TABLE user_settings ADD COLUMN currency TEXT DEFAULT 'IDR';
    END IF;

END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(date);
CREATE INDEX IF NOT EXISTS idx_fuel_records_user_date ON fuel_records(user_id, date);

-- Create monthly spending view
CREATE OR REPLACE VIEW monthly_spending AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month,
  COUNT(*) as record_count,
  SUM(total_cost) as total_spent,
  SUM(quantity) as total_quantity,
  SUM(distance_km) as total_distance,
  AVG(price_per_liter) as avg_price_per_liter,
  AVG(cost_per_km) as avg_cost_per_km
FROM fuel_records 
GROUP BY user_id, DATE_TRUNC('month', date)
ORDER BY user_id, month DESC; 