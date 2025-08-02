-- Create vehicles table for multiple vehicle management
-- Run this in Supabase SQL Editor

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  fuel_capacity DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_service_date DATE,
  service_interval_days INTEGER DEFAULT 90,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_primary ON vehicles(user_id, is_primary);

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically set user_id
CREATE OR REPLACE FUNCTION handle_vehicles()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vehicles table
DROP TRIGGER IF EXISTS handle_vehicles_trigger ON vehicles;
CREATE TRIGGER handle_vehicles_trigger
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION handle_vehicles();

-- Create trigger to ensure only one primary vehicle per user
CREATE OR REPLACE FUNCTION ensure_single_primary_vehicle()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a vehicle as primary, unset all others for this user
  IF NEW.is_primary = TRUE THEN
    UPDATE vehicles 
    SET is_primary = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for single primary vehicle
DROP TRIGGER IF EXISTS ensure_single_primary_trigger ON vehicles;
CREATE TRIGGER ensure_single_primary_trigger
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_vehicle();

-- Create view for vehicle service reminders
CREATE OR REPLACE VIEW vehicle_service_reminders AS
SELECT 
  v.id,
  v.user_id,
  v.name as vehicle_name,
  v.last_service_date,
  v.service_interval_days,
  v.last_service_date + (v.service_interval_days || ' days')::INTERVAL as next_service_date,
  CASE 
    WHEN v.last_service_date IS NULL THEN 'NO_SERVICE_DATE'
    WHEN v.last_service_date + (v.service_interval_days || ' days')::INTERVAL <= CURRENT_DATE THEN 
      'OVERDUE'
    WHEN v.last_service_date + (v.service_interval_days || ' days')::INTERVAL <= CURRENT_DATE + INTERVAL '7 days' THEN
      'DUE_SOON'
    ELSE
      'OK'
  END as service_status,
  CASE 
    WHEN v.last_service_date IS NULL THEN NULL
    WHEN v.last_service_date + (v.service_interval_days || ' days')::INTERVAL <= CURRENT_DATE THEN 
      (CURRENT_DATE - (v.last_service_date + (v.service_interval_days || ' days')::INTERVAL))::INTEGER
    WHEN v.last_service_date + (v.service_interval_days || ' days')::INTERVAL <= CURRENT_DATE + INTERVAL '7 days' THEN
      ((v.last_service_date + (v.service_interval_days || ' days')::INTERVAL) - CURRENT_DATE)::INTEGER
    ELSE
      ((v.last_service_date + (v.service_interval_days || ' days')::INTERVAL) - CURRENT_DATE)::INTEGER
  END as days_until_service
FROM vehicles v
WHERE v.last_service_date IS NOT NULL;

-- Verify the table was created
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position; 