-- Add carbon goals and challenges support to user_settings
-- Run this in Supabase SQL Editor

-- Add carbon goal column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS carbon_goal_kg DECIMAL(10,2) DEFAULT 100;

-- Add challenge points column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS challenge_points INTEGER DEFAULT 0;

-- Add achievements count column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS achievements_count INTEGER DEFAULT 0;

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement DECIMAL(10,2) NOT NULL,
  current_progress DECIMAL(10,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_points INTEGER DEFAULT 0,
  reward_badge TEXT,
  reward_title TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for challenges
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_completed ON challenges(user_id, is_completed);

-- Enable RLS for challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for challenges
CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" ON challenges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges" ON challenges
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for challenges
CREATE OR REPLACE FUNCTION handle_challenges()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for challenges table
DROP TRIGGER IF EXISTS handle_challenges_trigger ON challenges;
CREATE TRIGGER handle_challenges_trigger
  BEFORE INSERT OR UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION handle_challenges();

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_rarity ON user_achievements(rarity);

-- Enable RLS for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements" ON user_achievements
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for user_achievements
CREATE OR REPLACE FUNCTION handle_user_achievements()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user_achievements table
DROP TRIGGER IF EXISTS handle_user_achievements_trigger ON user_achievements;
CREATE TRIGGER handle_user_achievements_trigger
  BEFORE INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_achievements();

-- Create carbon footprint view
CREATE OR REPLACE VIEW carbon_footprint_summary AS
SELECT 
  fr.user_id,
  SUM(fr.quantity * 
    CASE 
      WHEN fr.fuel_type = 'Pertalite' THEN 2.31
      WHEN fr.fuel_type = 'Pertamax' THEN 2.35
      WHEN fr.fuel_type = 'Pertamax Turbo' THEN 2.38
      WHEN fr.fuel_type = 'Solar' THEN 2.68
      WHEN fr.fuel_type = 'Premium' THEN 2.35
      WHEN fr.fuel_type = 'Dexlite' THEN 2.31
      ELSE 2.35
    END
  ) as total_co2_kg,
  AVG(
    CASE 
      WHEN fr.fuel_type = 'Pertalite' THEN 2.31
      WHEN fr.fuel_type = 'Pertamax' THEN 2.35
      WHEN fr.fuel_type = 'Pertamax Turbo' THEN 2.38
      WHEN fr.fuel_type = 'Solar' THEN 2.68
      WHEN fr.fuel_type = 'Premium' THEN 2.35
      WHEN fr.fuel_type = 'Dexlite' THEN 2.31
      ELSE 2.35
    END
  ) as avg_co2_factor,
  SUM(fr.distance_km) as total_distance_km,
  SUM(fr.quantity) as total_fuel_l,
  CASE 
    WHEN SUM(fr.quantity) > 0 THEN SUM(fr.distance_km) / SUM(fr.quantity)
    ELSE 0
  END as fuel_efficiency_km_l,
  CASE 
    WHEN SUM(fr.distance_km) > 0 THEN 
      SUM(fr.quantity * 
        CASE 
          WHEN fr.fuel_type = 'Pertalite' THEN 2.31
          WHEN fr.fuel_type = 'Pertamax' THEN 2.35
          WHEN fr.fuel_type = 'Pertamax Turbo' THEN 2.38
          WHEN fr.fuel_type = 'Solar' THEN 2.68
          WHEN fr.fuel_type = 'Premium' THEN 2.35
          WHEN fr.fuel_type = 'Dexlite' THEN 2.31
          ELSE 2.35
        END
      ) / SUM(fr.distance_km)
    ELSE 0
  END as co2_per_km_kg
FROM fuel_records fr
GROUP BY fr.user_id;

-- Create monthly carbon footprint view
CREATE OR REPLACE VIEW monthly_carbon_footprint AS
SELECT 
  fr.user_id,
  DATE_TRUNC('month', fr.date::DATE) as month,
  SUM(fr.quantity * 
    CASE 
      WHEN fr.fuel_type = 'Pertalite' THEN 2.31
      WHEN fr.fuel_type = 'Pertamax' THEN 2.35
      WHEN fr.fuel_type = 'Pertamax Turbo' THEN 2.38
      WHEN fr.fuel_type = 'Solar' THEN 2.68
      WHEN fr.fuel_type = 'Premium' THEN 2.35
      WHEN fr.fuel_type = 'Dexlite' THEN 2.31
      ELSE 2.35
    END
  ) as monthly_co2_kg,
  COUNT(*) as record_count,
  SUM(fr.total_cost) as monthly_cost,
  SUM(fr.distance_km) as monthly_distance_km
FROM fuel_records fr
GROUP BY fr.user_id, DATE_TRUNC('month', fr.date::DATE)
ORDER BY fr.user_id, month DESC;

-- Verify the new columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name IN ('carbon_goal_kg', 'challenge_points', 'achievements_count')
ORDER BY ordinal_position; 