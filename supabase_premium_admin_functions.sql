-- =====================================================
-- FUELMETER ENHANCED FUNCTIONS
-- Premium & Admin Functions Setup
-- =====================================================

-- 14. Create enhanced function to check premium status
CREATE OR REPLACE FUNCTION is_user_premium(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_uuid 
        AND is_premium = TRUE 
        AND account_status = 'active'
        AND (premium_expires_at IS NULL OR premium_expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create enhanced function to check admin status
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_uuid 
        AND role IN ('admin', 'moderator')
        AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create enhanced function to get user usage limits
CREATE OR REPLACE FUNCTION get_user_usage(user_uuid UUID, feature TEXT)
RETURNS TABLE(usage_count INTEGER, limit_count INTEGER, can_use BOOLEAN, reset_date TIMESTAMPTZ) AS $$
DECLARE
    user_limit RECORD;
    reset_date TIMESTAMPTZ;
BEGIN
    -- Get user's usage limit
    SELECT * INTO user_limit
    FROM usage_limits 
    WHERE user_id = user_uuid AND feature_type = feature;
    
    -- Calculate next reset date
    IF user_limit.reset_period = 'daily' THEN
        reset_date := DATE_TRUNC('day', user_limit.last_reset_at) + INTERVAL '1 day';
    ELSIF user_limit.reset_period = 'weekly' THEN
        reset_date := DATE_TRUNC('week', user_limit.last_reset_at) + INTERVAL '1 week';
    ELSIF user_limit.reset_period = 'monthly' THEN
        reset_date := DATE_TRUNC('month', user_limit.last_reset_at) + INTERVAL '1 month';
    ELSIF user_limit.reset_period = 'yearly' THEN
        reset_date := DATE_TRUNC('year', user_limit.last_reset_at) + INTERVAL '1 year';
    END IF;
    
    -- Return usage data
    IF FOUND THEN
        RETURN QUERY
        SELECT 
            user_limit.usage_count,
            user_limit.limit_count,
            (is_user_premium(user_uuid) OR user_limit.usage_count < user_limit.limit_count) as can_use,
            reset_date;
    ELSE
        -- Return default values if no record exists
        RETURN QUERY
        SELECT 
            0 as usage_count,
            CASE 
                WHEN feature = 'pdf_reports' THEN 3
                WHEN feature = 'ai_scans' THEN 3
                WHEN feature = 'data_export' THEN 1
                WHEN feature = 'api_calls' THEN 100
                ELSE 0
            END as limit_count,
            is_user_premium(user_uuid) as can_use,
            NOW() + INTERVAL '1 month' as reset_date;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Create enhanced function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(user_uuid UUID, feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
    can_use BOOLEAN;
    reset_date TIMESTAMPTZ;
BEGIN
    -- Check if user can use the feature
    SELECT usage_count, limit_count, can_use, reset_date
    INTO current_usage, usage_limit, can_use, reset_date
    FROM get_user_usage(user_uuid, feature);
    
    -- If user can't use feature, return false
    IF NOT can_use THEN
        RETURN FALSE;
    END IF;
    
    -- Check if we need to reset usage (new period)
    IF NOW() >= reset_date THEN
        current_usage := 0;
    END IF;
    
    -- Insert or update usage
    INSERT INTO usage_limits (user_id, feature_type, usage_count, limit_count, last_reset_at)
    VALUES (user_uuid, feature, current_usage + 1, usage_limit, NOW())
    ON CONFLICT (user_id, feature_type)
    DO UPDATE SET 
        usage_count = EXCLUDED.usage_count,
        last_reset_at = EXCLUDED.last_reset_at,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Create function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a random 8-character code
        code := UPPER(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = code);
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique referral code';
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 19. Create function to apply referral bonus
CREATE OR REPLACE FUNCTION apply_referral_bonus(referrer_uuid UUID, referred_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    bonus_days INTEGER;
    max_bonus INTEGER;
BEGIN
    -- Get bonus settings
    SELECT (value::text)::integer INTO bonus_days
    FROM app_settings 
    WHERE key = 'referral_bonus_days';
    
    SELECT (value::text)::integer INTO max_bonus
    FROM app_settings 
    WHERE key = 'max_referral_bonus';
    
    -- Check if referrer hasn't exceeded max bonus
    IF (SELECT total_referral_earnings FROM profiles WHERE id = referrer_uuid) >= max_bonus THEN
        RETURN FALSE;
    END IF;
    
    -- Grant bonus to referrer
    UPDATE profiles 
    SET 
        total_referral_earnings = total_referral_earnings + bonus_days,
        updated_at = NOW()
    WHERE id = referrer_uuid;
    
    -- Grant trial premium to referred user
    PERFORM grant_premium_subscription(referred_uuid, 'trial', bonus_days);
    
    -- Log the referral
    INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
    VALUES (
        referrer_uuid,
        'referral_bonus_applied',
        'user',
        referred_uuid,
        jsonb_build_object(
            'bonus_days', bonus_days,
            'referrer_id', referrer_uuid
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Create function to validate discount code
CREATE OR REPLACE FUNCTION validate_discount_code(code_text TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    discount_percentage DECIMAL(5,2),
    max_uses INTEGER,
    current_uses INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as is_valid,
        dc.discount_percentage,
        dc.max_uses,
        dc.current_uses
    FROM discount_codes dc
    WHERE dc.code = code_text
    AND dc.is_active = TRUE
    AND (dc.valid_until IS NULL OR dc.valid_until > NOW())
    AND (dc.max_uses IS NULL OR dc.current_uses < dc.max_uses);
    
    -- If no valid code found, return invalid
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            FALSE as is_valid,
            0 as discount_percentage,
            0 as max_uses,
            0 as current_uses;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. Create enhanced function to grant premium subscription
CREATE OR REPLACE FUNCTION grant_premium_subscription(
    user_uuid UUID,
    subscription_type_name TEXT,
    duration_days INTEGER,
    admin_uuid UUID DEFAULT NULL,
    payment_amount DECIMAL DEFAULT NULL,
    discount_code_text TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    subscription_id UUID;
    expires_date TIMESTAMPTZ;
    final_amount DECIMAL(10,2);
    discount_percentage DECIMAL(5,2) := 0;
BEGIN
    -- Calculate expiry date
    expires_date := NOW() + (duration_days || ' days')::INTERVAL;
    
    -- Calculate amount with discount if applicable
    final_amount := COALESCE(payment_amount, 
        CASE 
            WHEN subscription_type_name = 'monthly' THEN 49000
            WHEN subscription_type_name = 'yearly' THEN 490000
            WHEN subscription_type_name = 'lifetime' THEN 1500000
            ELSE 0
        END
    );
    
    -- Apply discount if code provided
    IF discount_code_text IS NOT NULL THEN
        SELECT dc.discount_percentage INTO discount_percentage
        FROM discount_codes dc
        WHERE dc.code = discount_code_text
        AND dc.is_active = TRUE
        AND (dc.valid_until IS NULL OR dc.valid_until > NOW())
        AND (dc.max_uses IS NULL OR dc.current_uses < dc.max_uses);
        
        IF FOUND THEN
            final_amount := final_amount * (1 - discount_percentage / 100);
            
            -- Increment discount code usage
            UPDATE discount_codes 
            SET current_uses = current_uses + 1, updated_at = NOW()
            WHERE code = discount_code_text;
        END IF;
    END IF;
    
    -- Create subscription record
    INSERT INTO premium_subscriptions (
        user_id,
        subscription_type,
        status,
        started_at,
        expires_at,
        amount,
        currency,
        discount_percentage,
        discount_code
    ) VALUES (
        user_uuid,
        subscription_type_name,
        'active',
        NOW(),
        expires_date,
        final_amount,
        'IDR',
        discount_percentage,
        discount_code_text
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
                'expires_at', expires_date,
                'discount_code', discount_code_text,
                'discount_percentage', discount_percentage
            )
        );
    END IF;
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. Create enhanced function to revoke premium subscription
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

-- 23. Create enhanced function to make user admin
CREATE OR REPLACE FUNCTION make_user_admin(
    user_uuid UUID,
    admin_uuid UUID DEFAULT NULL,
    admin_role TEXT DEFAULT 'admin',
    admin_permissions TEXT[] DEFAULT ARRAY['all']
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate role
    IF admin_role NOT IN ('admin', 'moderator') THEN
        RAISE EXCEPTION 'Invalid admin role: %', admin_role;
    END IF;
    
    -- Update user role
    UPDATE profiles SET
        role = admin_role,
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
                'role', admin_role,
                'permissions', admin_permissions,
                'promoted_at', NOW()
            )
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 24. Create enhanced function to remove admin privileges
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

-- 25. Create enhanced function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    admin_uuid UUID,
    action_name TEXT,
    target_type_name TEXT DEFAULT NULL,
    target_uuid UUID DEFAULT NULL,
    action_details JSONB DEFAULT NULL,
    user_ip INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL,
    severity_level TEXT DEFAULT 'info'
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
        user_agent,
        severity
    ) VALUES (
        admin_uuid,
        action_name,
        target_type_name,
        target_uuid,
        action_details,
        user_ip,
        user_agent_string,
        severity_level
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 26. Create enhanced function to cleanup expired subscriptions
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

-- 27. Create enhanced function to reset usage limits
CREATE OR REPLACE FUNCTION reset_usage_limits()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    -- Reset daily usage limits
    UPDATE usage_limits 
    SET 
        usage_count = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE reset_period = 'daily' 
    AND last_reset_at < DATE_TRUNC('day', NOW());
    
    -- Reset weekly usage limits
    UPDATE usage_limits 
    SET 
        usage_count = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE reset_period = 'weekly' 
    AND last_reset_at < DATE_TRUNC('week', NOW());
    
    -- Reset monthly usage limits
    UPDATE usage_limits 
    SET 
        usage_count = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE reset_period = 'monthly' 
    AND last_reset_at < DATE_TRUNC('month', NOW());
    
    -- Reset yearly usage limits
    UPDATE usage_limits 
    SET 
        usage_count = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE reset_period = 'yearly' 
    AND last_reset_at < DATE_TRUNC('year', NOW());
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 28. Create enhanced function to get system health
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    status TEXT,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Total Users'::TEXT,
        COUNT(*)::NUMERIC,
        'healthy'::TEXT,
        NOW()::TIMESTAMPTZ
    FROM profiles
    UNION ALL
    SELECT 
        'Premium Users'::TEXT,
        COUNT(*)::NUMERIC,
        'healthy'::TEXT,
        NOW()::TIMESTAMPTZ
    FROM profiles WHERE is_premium = TRUE
    UNION ALL
    SELECT 
        'Active Subscriptions'::TEXT,
        COUNT(*)::NUMERIC,
        'healthy'::TEXT,
        NOW()::TIMESTAMPTZ
    FROM premium_subscriptions WHERE status = 'active'
    UNION ALL
    SELECT 
        'Expired Subscriptions'::TEXT,
        COUNT(*)::NUMERIC,
        'warning'::TEXT,
        NOW()::TIMESTAMPTZ
    FROM premium_subscriptions WHERE status = 'expired'
    UNION ALL
    SELECT 
        'Failed Payments'::TEXT,
        COUNT(*)::NUMERIC,
        CASE WHEN COUNT(*) > 10 THEN 'error' ELSE 'healthy' END::TEXT,
        NOW()::TIMESTAMPTZ
    FROM payments WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 29. Create enhanced function to generate analytics report
CREATE OR REPLACE FUNCTION generate_analytics_report(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    metric_change NUMERIC,
    period_start DATE,
    period_end DATE
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT
            COUNT(DISTINCT p.id) as total_users,
            COUNT(DISTINCT CASE WHEN p.is_premium THEN p.id END) as premium_users,
            COUNT(DISTINCT fr.id) as total_records,
            COALESCE(SUM(fr.total_cost), 0) as total_spent,
            COUNT(DISTINCT CASE WHEN p.created_at BETWEEN start_date AND end_date THEN p.id END) as new_users,
            COALESCE(SUM(CASE WHEN ps.status = 'active' THEN ps.amount ELSE 0 END), 0) as revenue,
            COUNT(DISTINCT CASE WHEN p.referred_by IS NOT NULL THEN p.id END) as referral_signups
        FROM profiles p
        LEFT JOIN fuel_records fr ON p.id = fr.user_id AND fr.created_at BETWEEN start_date AND end_date
        LEFT JOIN premium_subscriptions ps ON p.id = ps.user_id AND ps.status = 'active'
    ),
    previous_period AS (
        SELECT
            COUNT(DISTINCT p.id) as total_users,
            COUNT(DISTINCT CASE WHEN p.is_premium THEN p.id END) as premium_users,
            COUNT(DISTINCT fr.id) as total_records,
            COALESCE(SUM(fr.total_cost), 0) as total_spent,
            COUNT(DISTINCT CASE WHEN p.created_at BETWEEN (start_date - (end_date - start_date)) AND start_date THEN p.id END) as new_users,
            COALESCE(SUM(CASE WHEN ps.status = 'active' THEN ps.amount ELSE 0 END), 0) as revenue,
            COUNT(DISTINCT CASE WHEN p.referred_by IS NOT NULL THEN p.id END) as referral_signups
        FROM profiles p
        LEFT JOIN fuel_records fr ON p.id = fr.user_id AND fr.created_at BETWEEN (start_date - (end_date - start_date)) AND start_date
        LEFT JOIN premium_subscriptions ps ON p.id = ps.user_id AND ps.status = 'active'
    )
    SELECT 'Total Users'::TEXT, cp.total_users::NUMERIC, (cp.total_users - pp.total_users)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'Premium Users'::TEXT, cp.premium_users::NUMERIC, (cp.premium_users - pp.premium_users)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'Total Records'::TEXT, cp.total_records::NUMERIC, (cp.total_records - pp.total_records)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'Total Spent'::TEXT, cp.total_spent::NUMERIC, (cp.total_spent - pp.total_spent)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'New Users'::TEXT, cp.new_users::NUMERIC, (cp.new_users - pp.new_users)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'Revenue'::TEXT, cp.revenue::NUMERIC, (cp.revenue - pp.revenue)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'Referral Signups'::TEXT, cp.referral_signups::NUMERIC, (cp.referral_signups - pp.referral_signups)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 30. Create function to setup default usage limits for new users
CREATE OR REPLACE FUNCTION setup_default_usage_limits(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_limits (user_id, feature_type, usage_count, limit_count, reset_period) VALUES
    (user_uuid, 'pdf_reports', 0, 3, 'monthly'),
    (user_uuid, 'ai_scans', 0, 3, 'monthly'),
    (user_uuid, 'data_export', 0, 1, 'monthly'),
    (user_uuid, 'api_calls', 0, 100, 'daily'),
    (user_uuid, 'advanced_analytics', 0, 5, 'monthly')
    ON CONFLICT (user_id, feature_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 31. Create trigger to setup usage limits for new users
CREATE OR REPLACE FUNCTION setup_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Setup default usage limits
    PERFORM setup_default_usage_limits(NEW.id);
    
    -- Generate referral code if not exists
    IF NEW.referral_code IS NULL THEN
        UPDATE profiles 
        SET referral_code = generate_referral_code()
        WHERE id = NEW.id;
    END IF;
    
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

-- =====================================================
-- ENHANCED FUNCTIONS SETUP COMPLETE!
-- ===================================================== 