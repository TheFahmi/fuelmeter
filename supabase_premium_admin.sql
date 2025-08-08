-- =====================================================
-- FUELMETER SUPABASE SQL SCRIPT
-- Premium & Admin Features Setup
-- =====================================================

-- 1. Update profiles table with premium and admin columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS premium_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly', 'lifetime')),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.1. Update user_settings table with additional premium and preference columns
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'car',
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS license_plate TEXT,
ADD COLUMN IF NOT EXISTS fuel_capacity DECIMAL(10,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS fuel_efficiency_km_l DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(15,2) DEFAULT 500000.00,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR',
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS service_interval_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS carbon_goal_kg DECIMAL(10,2) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS carbon_intensity_kg_co2_l DECIMAL(5,2) DEFAULT 2.31,
ADD COLUMN IF NOT EXISTS challenge_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievements_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"budgetAlerts": true, "serviceReminders": true, "lowFuelAlerts": true, "achievementNotifications": true, "weeklyReports": true, "priceAlerts": true, "pushEnabled": false, "emailEnabled": true}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"shareData": false, "publicProfile": false, "analyticsOptOut": false}'::jsonb,
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'id' CHECK (language_preference IN ('id', 'en')),
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jakarta';

-- 2. Create premium_subscriptions table for detailed subscription tracking
CREATE TABLE IF NOT EXISTS premium_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly', 'yearly', 'lifetime')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'IDR',
    payment_method TEXT,
    payment_provider TEXT,
    payment_id TEXT,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create payments table for payment history
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES premium_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'IDR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    payment_provider TEXT,
    payment_id TEXT,
    payment_data JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create admin_logs table for admin activity tracking
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'record', 'subscription', etc.
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create app_settings table for system configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create usage_limits table for tracking free tier usage
CREATE TABLE IF NOT EXISTS usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL, -- 'pdf_reports', 'ai_scans', etc.
    usage_count INTEGER DEFAULT 0,
    limit_count INTEGER NOT NULL,
    reset_period TEXT DEFAULT 'monthly' CHECK (reset_period IN ('daily', 'weekly', 'monthly', 'yearly')),
    last_reset_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature_type)
);

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_expires ON profiles(premium_expires_at);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_expires ON premium_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_feature ON usage_limits(user_id, feature_type);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_vehicle_type ON user_settings(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);

-- 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_subscriptions_updated_at BEFORE UPDATE ON premium_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_limits_updated_at BEFORE UPDATE ON usage_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert default app settings
INSERT INTO app_settings (key, value, description, category, is_public) VALUES
('app_name', '"FuelMeter"', 'Application name', 'general', true),
('app_description', '"Track your fuel consumption and expenses"', 'Application description', 'general', true),
('premium_monthly_price', '49000', 'Monthly premium price in IDR', 'pricing', true),
('premium_yearly_price', '490000', 'Yearly premium price in IDR', 'pricing', true),
('free_pdf_limit', '3', 'Free PDF reports limit per month', 'limits', true),
('free_scan_limit', '3', 'Free AI scans limit per month', 'limits', true),
('maintenance_mode', 'false', 'Enable maintenance mode', 'system', false),
('registration_enabled', 'true', 'Enable user registration', 'system', false),
('email_notifications', 'true', 'Enable email notifications', 'system', false)
ON CONFLICT (key) DO NOTHING;

-- 11. Create function to check premium status
CREATE OR REPLACE FUNCTION is_user_premium(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_uuid 
        AND is_premium = TRUE 
        AND (premium_expires_at IS NULL OR premium_expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to check admin status
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_uuid 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to get user usage limits
CREATE OR REPLACE FUNCTION get_user_usage(user_uuid UUID, feature TEXT)
RETURNS TABLE(usage_count INTEGER, limit_count INTEGER, can_use BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ul.usage_count, 0) as usage_count,
        COALESCE(ul.limit_count, 0) as limit_count,
        (is_user_premium(user_uuid) OR COALESCE(ul.usage_count, 0) < COALESCE(ul.limit_count, 0)) as can_use
    FROM usage_limits ul
    WHERE ul.user_id = user_uuid AND ul.feature_type = feature;
    
    -- If no record exists, return default values
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            0 as usage_count,
            CASE 
                WHEN feature = 'pdf_reports' THEN 3
                WHEN feature = 'ai_scans' THEN 3
                ELSE 0
            END as limit_count,
            is_user_premium(user_uuid) as can_use;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(user_uuid UUID, feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
    can_use BOOLEAN;
BEGIN
    -- Check if user can use the feature
    SELECT usage_count, limit_count, can_use 
    INTO current_usage, usage_limit, can_use
    FROM get_user_usage(user_uuid, feature);
    
    -- If user can't use feature, return false
    IF NOT can_use THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update usage
    INSERT INTO usage_limits (user_id, feature_type, usage_count, limit_count)
    VALUES (user_uuid, feature, 1, usage_limit)
    ON CONFLICT (user_id, feature_type)
    DO UPDATE SET 
        usage_count = usage_limits.usage_count + 1,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create RLS (Row Level Security) policies
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON premium_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Only admins can view admin logs
CREATE POLICY "Admins can view admin logs" ON admin_logs
    FOR ALL USING (is_user_admin(auth.uid()));

-- Users can only see their own usage limits
CREATE POLICY "Users can view own usage limits" ON usage_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all data
CREATE POLICY "Admins can view all subscriptions" ON premium_subscriptions
    FOR ALL USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can view all usage limits" ON usage_limits
    FOR ALL USING (is_user_admin(auth.uid()));

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user settings" ON user_settings
    FOR ALL USING (is_user_admin(auth.uid()));

-- 16. Create sample admin user (CHANGE EMAIL AND PASSWORD!)
-- Note: This will only work if the user already exists in auth.users
-- You need to create the user first through Supabase Auth, then run this:
/*
UPDATE profiles 
SET 
    role = 'admin',
    permissions = ARRAY['all'],
    updated_at = NOW()
WHERE email = 'admin@fuelmeter.com'; -- CHANGE THIS EMAIL!
*/

-- 17. Create function to clean expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update expired premium subscriptions
    UPDATE premium_subscriptions 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' AND expires_at < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Update user premium status
    UPDATE profiles 
    SET is_premium = FALSE, updated_at = NOW()
    WHERE is_premium = TRUE 
    AND premium_expires_at < NOW();
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Create function to reset monthly usage limits
CREATE OR REPLACE FUNCTION reset_monthly_usage_limits()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    UPDATE usage_limits 
    SET 
        usage_count = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE reset_period = 'monthly' 
    AND last_reset_at < DATE_TRUNC('month', NOW());
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- To create an admin user:
-- 1. First register the user normally through your app
-- 2. Then run this SQL (replace with actual email):
-- UPDATE profiles SET role = 'admin', permissions = ARRAY['all'] WHERE email = 'your-admin@email.com';

-- To grant premium to a user:
-- UPDATE profiles SET is_premium = TRUE, premium_expires_at = NOW() + INTERVAL '30 days' WHERE email = 'user@email.com';

-- To check premium status:
-- SELECT is_user_premium('user-uuid-here');

-- To check usage limits:
-- SELECT * FROM get_user_usage('user-uuid-here', 'pdf_reports');
