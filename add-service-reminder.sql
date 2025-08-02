-- Add service reminder columns to user_settings table
-- Run this in Supabase SQL Editor

-- Add service-related columns
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS service_interval_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS next_service_date DATE;

-- Create function to calculate next service date
CREATE OR REPLACE FUNCTION calculate_next_service_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_service_date IS NOT NULL AND NEW.service_interval_days IS NOT NULL THEN
    NEW.next_service_date := NEW.last_service_date + (NEW.service_interval_days || ' days')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate next service date
DROP TRIGGER IF EXISTS trigger_calculate_next_service_date ON user_settings;
CREATE TRIGGER trigger_calculate_next_service_date
  BEFORE INSERT OR UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_next_service_date();

-- Create view for service reminders
CREATE OR REPLACE VIEW service_reminders AS
SELECT 
  user_id,
  last_service_date,
  service_interval_days,
  next_service_date,
  CASE 
    WHEN next_service_date IS NULL THEN NULL
    WHEN next_service_date <= CURRENT_DATE THEN 
      'OVERDUE: ' || (CURRENT_DATE - next_service_date) || ' days overdue'
    WHEN next_service_date <= CURRENT_DATE + INTERVAL '7 days' THEN
      'DUE SOON: ' || (next_service_date - CURRENT_DATE) || ' days remaining'
    ELSE
      'OK: ' || (next_service_date - CURRENT_DATE) || ' days remaining'
  END as status
FROM user_settings
WHERE last_service_date IS NOT NULL AND service_interval_days IS NOT NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name IN ('last_service_date', 'service_interval_days', 'next_service_date')
ORDER BY ordinal_position; 