-- Add profile and budget tracking columns to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS fuel_capacity DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';

-- Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(date);
CREATE INDEX IF NOT EXISTS idx_fuel_records_user_date ON fuel_records(user_id, date);

-- Create a view for monthly spending analytics
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

-- Create RLS policy for the view
DROP POLICY IF EXISTS "Users can view own monthly spending" ON monthly_spending;
-- Note: Views inherit RLS from underlying tables, so fuel_records policies apply 