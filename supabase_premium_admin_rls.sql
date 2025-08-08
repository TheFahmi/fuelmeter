-- =====================================================
-- FUELMETER ROW LEVEL SECURITY POLICIES
-- Premium & Admin RLS Setup
-- =====================================================

-- Enable Row Level Security on all premium and admin tables
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PREMIUM SUBSCRIPTIONS POLICIES
-- =====================================================

-- Users can only see their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON premium_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON premium_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own subscriptions (for trial subscriptions)
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON premium_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON premium_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscriptions (for cancellation)
DROP POLICY IF EXISTS "Users can update own subscriptions" ON premium_subscriptions;
CREATE POLICY "Users can update own subscriptions" ON premium_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can see all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON premium_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON premium_subscriptions
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- Users can only see their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own payments
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own payments
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can see all payments
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- ADMIN LOGS POLICIES
-- =====================================================

-- Only admins can view admin logs
DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
CREATE POLICY "Admins can view admin logs" ON admin_logs
    FOR ALL USING (is_user_admin(auth.uid()));

-- Users can view their own admin actions (if they are admin)
DROP POLICY IF EXISTS "Users can view own admin actions" ON admin_logs;
CREATE POLICY "Users can view own admin actions" ON admin_logs
    FOR SELECT USING (auth.uid() = admin_id);

-- =====================================================
-- USAGE LIMITS POLICIES
-- =====================================================

-- Users can only see their own usage limits
DROP POLICY IF EXISTS "Users can view own usage limits" ON usage_limits;
CREATE POLICY "Users can view own usage limits" ON usage_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own usage limits
DROP POLICY IF EXISTS "Users can insert own usage limits" ON usage_limits;
CREATE POLICY "Users can insert own usage limits" ON usage_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own usage limits
DROP POLICY IF EXISTS "Users can update own usage limits" ON usage_limits;
CREATE POLICY "Users can update own usage limits" ON usage_limits
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can see all usage limits
DROP POLICY IF EXISTS "Admins can view all usage limits" ON usage_limits;
CREATE POLICY "Admins can view all usage limits" ON usage_limits
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- DISCOUNT CODES POLICIES
-- =====================================================

-- All authenticated users can view active discount codes
DROP POLICY IF EXISTS "Users can view active discount codes" ON discount_codes;
CREATE POLICY "Users can view active discount codes" ON discount_codes
    FOR SELECT USING (
        is_active = TRUE 
        AND (valid_until IS NULL OR valid_until > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
    );

-- Only admins can manage discount codes
DROP POLICY IF EXISTS "Admins can manage discount codes" ON discount_codes;
CREATE POLICY "Admins can manage discount codes" ON discount_codes
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- USER ACHIEVEMENTS POLICIES
-- =====================================================

-- Users can only see their own achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own achievements
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own achievements
DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
CREATE POLICY "Users can update own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can see all achievements
DROP POLICY IF EXISTS "Admins can view all achievements" ON user_achievements;
CREATE POLICY "Admins can view all achievements" ON user_achievements
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- SYSTEM ALERTS POLICIES
-- =====================================================

-- Users can view active system alerts that apply to them
DROP POLICY IF EXISTS "Users can view active alerts" ON system_alerts;
CREATE POLICY "Users can view active alerts" ON system_alerts
    FOR SELECT USING (
        is_active = TRUE 
        AND (valid_until IS NULL OR valid_until > NOW())
        AND (
            target_roles IS NULL 
            OR target_roles = '{}' 
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = ANY(target_roles)
            )
        )
        AND (
            target_users IS NULL 
            OR target_users = '{}' 
            OR auth.uid() = ANY(target_users)
        )
    );

-- Only admins can manage system alerts
DROP POLICY IF EXISTS "Admins can manage system alerts" ON system_alerts;
CREATE POLICY "Admins can manage system alerts" ON system_alerts
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- APP SETTINGS POLICIES
-- =====================================================

-- All authenticated users can view public app settings
DROP POLICY IF EXISTS "Users can view public settings" ON app_settings;
CREATE POLICY "Users can view public settings" ON app_settings
    FOR SELECT USING (is_public = TRUE);

-- Only admins can view and manage all app settings
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- PROFILES ENHANCED POLICIES
-- =====================================================

-- Users can view their own profile with all details
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND (
            -- Users can update these fields
            NEW.full_name IS NOT DISTINCT FROM OLD.full_name OR
            NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url OR
            NEW.updated_at IS NOT DISTINCT FROM NOW()
        )
        AND (
            -- Users cannot update these fields
            NEW.role IS DISTINCT FROM OLD.role OR
            NEW.is_premium IS DISTINCT FROM OLD.is_premium OR
            NEW.permissions IS DISTINCT FROM OLD.permissions OR
            NEW.account_status IS DISTINCT FROM OLD.account_status
        ) = FALSE
    );

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_user_admin(auth.uid()));

-- Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_user_admin(auth.uid()));

-- =====================================================
-- FUEL RECORDS ENHANCED POLICIES
-- =====================================================

-- Users can only see their own fuel records
DROP POLICY IF EXISTS "Users can view own fuel records" ON fuel_records;
CREATE POLICY "Users can view own fuel records" ON fuel_records
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own fuel records
DROP POLICY IF EXISTS "Users can insert own fuel records" ON fuel_records;
CREATE POLICY "Users can insert own fuel records" ON fuel_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own fuel records
DROP POLICY IF EXISTS "Users can update own fuel records" ON fuel_records;
CREATE POLICY "Users can update own fuel records" ON fuel_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own fuel records
DROP POLICY IF EXISTS "Users can delete own fuel records" ON fuel_records;
CREATE POLICY "Users can delete own fuel records" ON fuel_records
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can see all fuel records
DROP POLICY IF EXISTS "Admins can view all fuel records" ON fuel_records;
CREATE POLICY "Admins can view all fuel records" ON fuel_records
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- USER SETTINGS ENHANCED POLICIES
-- =====================================================

-- Users can only see their own settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own settings
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own settings
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can see all user settings
DROP POLICY IF EXISTS "Admins can view all user settings" ON user_settings;
CREATE POLICY "Admins can view all user settings" ON user_settings
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- VEHICLES ENHANCED POLICIES
-- =====================================================

-- Users can only see their own vehicles
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
CREATE POLICY "Users can view own vehicles" ON vehicles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own vehicles
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
CREATE POLICY "Users can insert own vehicles" ON vehicles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own vehicles
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
CREATE POLICY "Users can update own vehicles" ON vehicles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own vehicles
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
CREATE POLICY "Users can delete own vehicles" ON vehicles
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can see all vehicles
DROP POLICY IF EXISTS "Admins can view all vehicles" ON vehicles;
CREATE POLICY "Admins can view all vehicles" ON vehicles
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- CHALLENGES ENHANCED POLICIES
-- =====================================================

-- Users can only see their own challenges
DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
CREATE POLICY "Users can view own challenges" ON challenges
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own challenges
DROP POLICY IF EXISTS "Users can insert own challenges" ON challenges;
CREATE POLICY "Users can insert own challenges" ON challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own challenges
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
CREATE POLICY "Users can update own challenges" ON challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own challenges
DROP POLICY IF EXISTS "Users can delete own challenges" ON challenges;
CREATE POLICY "Users can delete own challenges" ON challenges
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can see all challenges
DROP POLICY IF EXISTS "Admins can view all challenges" ON challenges;
CREATE POLICY "Admins can view all challenges" ON challenges
    FOR ALL USING (is_user_admin(auth.uid()));

-- =====================================================
-- RLS SETUP COMPLETE!
-- =====================================================

-- To verify RLS is working correctly:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('premium_subscriptions', 'payments', 'admin_logs', 'usage_limits', 'discount_codes', 'user_achievements', 'system_alerts');

-- To test policies:
-- -- Test user can only see their own data
-- SELECT * FROM premium_subscriptions WHERE user_id = auth.uid();
-- 
-- -- Test admin can see all data
-- SELECT * FROM premium_subscriptions WHERE is_user_admin(auth.uid());
-- 
-- -- Test usage limits
-- SELECT * FROM get_user_usage(auth.uid(), 'pdf_reports');
-- 
-- -- Test premium status
-- SELECT is_user_premium(auth.uid());
-- 
-- -- Test admin status
-- SELECT is_user_admin(auth.uid()); 