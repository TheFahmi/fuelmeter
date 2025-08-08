-- =====================================================
-- FUELMETER INITIAL DATA SETUP
-- Sample data and admin user creation
-- =====================================================

-- 1. Insert sample app settings (if not exists)
INSERT INTO app_settings (key, value, description, category, is_public) VALUES
('welcome_message', '"Welcome to FuelMeter - Track your fuel efficiently!"', 'Welcome message for new users', 'general', true),
('max_file_size', '5242880', 'Maximum file upload size in bytes (5MB)', 'system', false),
('supported_file_types', '["image/jpeg", "image/png", "image/jpg"]', 'Supported file types for receipt upload', 'system', true),
('ai_processing_timeout', '30', 'AI processing timeout in seconds', 'system', false),
('backup_retention_days', '90', 'Number of days to retain backups', 'system', false),
('session_timeout_hours', '24', 'User session timeout in hours', 'security', false),
('password_min_length', '8', 'Minimum password length', 'security', true),
('enable_2fa', 'false', 'Enable two-factor authentication', 'security', false),
('rate_limit_requests', '100', 'Rate limit requests per minute', 'security', false),
('analytics_retention_months', '12', 'Analytics data retention in months', 'analytics', false)
ON CONFLICT (key) DO NOTHING;

-- 2. Create sample premium subscription plans
INSERT INTO app_settings (key, value, description, category, is_public) VALUES
('premium_features', '["unlimited_reports", "advanced_analytics", "ai_receipt_scanner", "priority_support", "real_time_sync", "early_access"]', 'List of premium features', 'premium', true),
('free_features', '["basic_reports", "manual_entry", "basic_analytics"]', 'List of free features', 'premium', true),
('trial_period_days', '7', 'Free trial period in days', 'premium', true),
('referral_bonus_days', '30', 'Bonus premium days for referrals', 'premium', false)
ON CONFLICT (key) DO NOTHING;

-- 3. Insert default usage limits for new users
CREATE OR REPLACE FUNCTION setup_default_usage_limits(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_limits (user_id, feature_type, usage_count, limit_count, reset_period) VALUES
    (user_uuid, 'pdf_reports', 0, 3, 'monthly'),
    (user_uuid, 'ai_scans', 0, 3, 'monthly'),
    (user_uuid, 'data_export', 0, 1, 'monthly'),
    (user_uuid, 'api_calls', 0, 100, 'daily')
    ON CONFLICT (user_id, feature_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to setup usage limits for new users
CREATE OR REPLACE FUNCTION setup_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Setup default usage limits
    PERFORM setup_default_usage_limits(NEW.id);
    
    -- Log user creation
    INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
    VALUES (
        NEW.id,
        'user_registered',
        'user',
        NEW.id,
        jsonb_build_object(
            'email', NEW.email,
            'registration_method', 'standard',
            'timestamp', NOW()
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user setup
DROP TRIGGER IF EXISTS trigger_setup_new_user ON profiles;
CREATE TRIGGER trigger_setup_new_user
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION setup_new_user();

-- 5. Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    admin_uuid UUID,
    action_name TEXT,
    target_type_name TEXT DEFAULT NULL,
    target_uuid UUID DEFAULT NULL,
    action_details JSONB DEFAULT NULL,
    user_ip INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_logs (
        admin_id,
        action,
        target_type,
        target_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        admin_uuid,
        action_name,
        target_type_name,
        target_uuid,
        action_details,
        user_ip,
        user_agent_string
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to grant premium subscription
CREATE OR REPLACE FUNCTION grant_premium_subscription(
    user_uuid UUID,
    subscription_type_name TEXT,
    duration_days INTEGER,
    admin_uuid UUID DEFAULT NULL,
    payment_amount DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    subscription_id UUID;
    expires_date TIMESTAMPTZ;
BEGIN
    -- Calculate expiry date
    expires_date := NOW() + (duration_days || ' days')::INTERVAL;
    
    -- Create subscription record
    INSERT INTO premium_subscriptions (
        user_id,
        subscription_type,
        status,
        started_at,
        expires_at,
        amount,
        currency
    ) VALUES (
        user_uuid,
        subscription_type_name,
        'active',
        NOW(),
        expires_date,
        COALESCE(payment_amount, 
            CASE 
                WHEN subscription_type_name = 'monthly' THEN 49000
                WHEN subscription_type_name = 'yearly' THEN 490000
                ELSE 0
            END
        ),
        'IDR'
    ) RETURNING id INTO subscription_id;
    
    -- Update user profile
    UPDATE profiles SET
        is_premium = TRUE,
        premium_expires_at = expires_date,
        premium_started_at = NOW(),
        subscription_type = subscription_type_name,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Log admin action if admin provided
    IF admin_uuid IS NOT NULL THEN
        PERFORM log_admin_action(
            admin_uuid,
            'grant_premium',
            'subscription',
            subscription_id,
            jsonb_build_object(
                'user_id', user_uuid,
                'subscription_type', subscription_type_name,
                'duration_days', duration_days,
                'expires_at', expires_date
            )
        );
    END IF;
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to revoke premium subscription
CREATE OR REPLACE FUNCTION revoke_premium_subscription(
    user_uuid UUID,
    admin_uuid UUID DEFAULT NULL,
    reason TEXT DEFAULT 'admin_revoked'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update active subscriptions
    UPDATE premium_subscriptions SET
        status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE user_id = user_uuid AND status = 'active';
    
    -- Update user profile
    UPDATE profiles SET
        is_premium = FALSE,
        premium_expires_at = NULL,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Log admin action if admin provided
    IF admin_uuid IS NOT NULL THEN
        PERFORM log_admin_action(
            admin_uuid,
            'revoke_premium',
            'user',
            user_uuid,
            jsonb_build_object(
                'reason', reason,
                'revoked_at', NOW()
            )
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to make user admin
CREATE OR REPLACE FUNCTION make_user_admin(
    user_uuid UUID,
    admin_uuid UUID DEFAULT NULL,
    admin_permissions TEXT[] DEFAULT ARRAY['all']
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user role
    UPDATE profiles SET
        role = 'admin',
        permissions = admin_permissions,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Log admin action if admin provided
    IF admin_uuid IS NOT NULL THEN
        PERFORM log_admin_action(
            admin_uuid,
            'make_admin',
            'user',
            user_uuid,
            jsonb_build_object(
                'permissions', admin_permissions,
                'promoted_at', NOW()
            )
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to remove admin privileges
CREATE OR REPLACE FUNCTION remove_admin_privileges(
    user_uuid UUID,
    admin_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user role
    UPDATE profiles SET
        role = 'user',
        permissions = '{}',
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Log admin action if admin provided
    IF admin_uuid IS NOT NULL THEN
        PERFORM log_admin_action(
            admin_uuid,
            'remove_admin',
            'user',
            user_uuid,
            jsonb_build_object(
                'demoted_at', NOW()
            )
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM profiles WHERE is_premium = TRUE) as premium_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*) FROM profiles WHERE last_sign_in_at >= NOW() - INTERVAL '7 days') as active_users_week,
    (SELECT COUNT(*) FROM fuel_records) as total_records,
    (SELECT COUNT(*) FROM fuel_records WHERE created_at >= CURRENT_DATE) as records_today,
    (SELECT COALESCE(SUM(amount), 0) FROM premium_subscriptions WHERE status = 'active') as total_revenue,
    (SELECT COUNT(*) FROM premium_subscriptions WHERE status = 'active' AND subscription_type = 'monthly') as monthly_subscribers,
    (SELECT COUNT(*) FROM premium_subscriptions WHERE status = 'active' AND subscription_type = 'yearly') as yearly_subscribers;

-- 11. Create view for user analytics
CREATE OR REPLACE VIEW user_analytics AS
SELECT
    p.id,
    p.email,
    p.full_name,
    p.is_premium,
    p.role,
    p.created_at as joined_at,
    p.last_sign_in_at,
    (SELECT COUNT(*) FROM fuel_records fr WHERE fr.user_id = p.id) as total_records,
    (SELECT COALESCE(SUM(fr.total_cost), 0) FROM fuel_records fr WHERE fr.user_id = p.id) as total_spent,
    (SELECT COUNT(*) FROM premium_subscriptions ps WHERE ps.user_id = p.id) as subscription_count,
    CASE 
        WHEN p.last_sign_in_at >= NOW() - INTERVAL '7 days' THEN 'active'
        WHEN p.last_sign_in_at >= NOW() - INTERVAL '30 days' THEN 'inactive'
        ELSE 'dormant'
    END as user_status
FROM profiles p;

-- 12. Sample data for testing (OPTIONAL - Remove in production)
/*
-- Create sample premium subscription
INSERT INTO premium_subscriptions (user_id, subscription_type, status, started_at, expires_at, amount, currency)
SELECT 
    id,
    'monthly',
    'active',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    49000,
    'IDR'
FROM profiles 
WHERE email = 'test@example.com'
LIMIT 1;

-- Create sample payment
INSERT INTO payments (user_id, amount, currency, status, payment_method, processed_at)
SELECT 
    id,
    49000,
    'IDR',
    'completed',
    'credit_card',
    NOW() - INTERVAL '15 days'
FROM profiles 
WHERE email = 'test@example.com'
LIMIT 1;
*/

-- =====================================================
-- INITIAL DATA SETUP COMPLETE!
-- =====================================================

-- To create your first admin user:
-- 1. Register normally through the app with your email
-- 2. Run this command (replace with your email):
-- SELECT make_user_admin((SELECT id FROM profiles WHERE email = 'your-email@domain.com'));

-- To grant premium to a user:
-- SELECT grant_premium_subscription((SELECT id FROM profiles WHERE email = 'user@email.com'), 'monthly', 30);

-- To view dashboard stats:
-- SELECT * FROM admin_dashboard_stats;

-- To view user analytics:
-- SELECT * FROM user_analytics ORDER BY total_spent DESC LIMIT 10;
