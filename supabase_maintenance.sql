-- =====================================================
-- FUELMETER MAINTENANCE & CLEANUP SCRIPTS
-- Scheduled tasks and database maintenance
-- =====================================================

-- 1. Create function to cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS TABLE(
    expired_subscriptions INTEGER,
    updated_users INTEGER,
    cleaned_logs INTEGER,
    reset_limits INTEGER
) AS $$
DECLARE
    exp_subs INTEGER := 0;
    upd_users INTEGER := 0;
    clean_logs INTEGER := 0;
    reset_lim INTEGER := 0;
BEGIN
    -- Update expired subscriptions
    UPDATE premium_subscriptions 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' AND expires_at < NOW();
    GET DIAGNOSTICS exp_subs = ROW_COUNT;
    
    -- Update user premium status for expired subscriptions
    UPDATE profiles 
    SET is_premium = FALSE, updated_at = NOW()
    WHERE is_premium = TRUE 
    AND (premium_expires_at IS NOT NULL AND premium_expires_at < NOW());
    GET DIAGNOSTICS upd_users = ROW_COUNT;
    
    -- Clean old admin logs (older than 6 months)
    DELETE FROM admin_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
    GET DIAGNOSTICS clean_logs = ROW_COUNT;
    
    -- Reset monthly usage limits if it's a new month
    UPDATE usage_limits 
    SET 
        usage_count = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE reset_period = 'monthly' 
    AND DATE_TRUNC('month', last_reset_at) < DATE_TRUNC('month', NOW());
    GET DIAGNOSTICS reset_lim = ROW_COUNT;
    
    -- Reset daily usage limits if it's a new day
    UPDATE usage_limits 
    SET 
        usage_count = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE reset_period = 'daily' 
    AND DATE_TRUNC('day', last_reset_at) < DATE_TRUNC('day', NOW());
    
    RETURN QUERY SELECT exp_subs, upd_users, clean_logs, reset_lim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to generate analytics report
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
            COALESCE(SUM(CASE WHEN ps.status = 'active' THEN ps.amount ELSE 0 END), 0) as revenue
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
            COALESCE(SUM(CASE WHEN ps.status = 'active' THEN ps.amount ELSE 0 END), 0) as revenue
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
    SELECT 'Total Revenue'::TEXT, cp.revenue::NUMERIC, (cp.revenue - pp.revenue)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'New Users'::TEXT, cp.new_users::NUMERIC, (cp.new_users - pp.new_users)::NUMERIC, start_date, end_date FROM current_period cp, previous_period pp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to backup user data
CREATE OR REPLACE FUNCTION backup_user_data(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_backup JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*),
        'fuel_records', (
            SELECT jsonb_agg(to_jsonb(fr.*))
            FROM fuel_records fr
            WHERE fr.user_id = user_uuid
        ),
        'subscriptions', (
            SELECT jsonb_agg(to_jsonb(ps.*))
            FROM premium_subscriptions ps
            WHERE ps.user_id = user_uuid
        ),
        'payments', (
            SELECT jsonb_agg(to_jsonb(pay.*))
            FROM payments pay
            WHERE pay.user_id = user_uuid
        ),
        'usage_limits', (
            SELECT jsonb_agg(to_jsonb(ul.*))
            FROM usage_limits ul
            WHERE ul.user_id = user_uuid
        ),
        'backup_created_at', NOW()
    ) INTO user_backup
    FROM profiles p
    WHERE p.id = user_uuid;
    
    RETURN user_backup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to restore user data
CREATE OR REPLACE FUNCTION restore_user_data(backup_data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Extract user ID from backup
    user_id := (backup_data->'profile'->>'id')::UUID;
    
    -- This is a simplified restore - in production you'd want more validation
    -- and conflict resolution
    
    RAISE NOTICE 'Restore function created but not implemented for safety. Manual restore required.';
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get system health status
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details JSONB,
    last_checked TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Database'::TEXT as component,
        'healthy'::TEXT as status,
        jsonb_build_object(
            'total_size', pg_size_pretty(pg_database_size(current_database())),
            'total_tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
            'active_connections', (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active')
        ) as details,
        NOW() as last_checked
    UNION ALL
    SELECT 
        'Users'::TEXT,
        CASE WHEN (SELECT COUNT(*) FROM profiles) > 0 THEN 'healthy' ELSE 'warning' END,
        jsonb_build_object(
            'total_users', (SELECT COUNT(*) FROM profiles),
            'active_users_7d', (SELECT COUNT(*) FROM profiles WHERE last_sign_in_at >= NOW() - INTERVAL '7 days'),
            'premium_users', (SELECT COUNT(*) FROM profiles WHERE is_premium = TRUE)
        ),
        NOW()
    UNION ALL
    SELECT 
        'Subscriptions'::TEXT,
        'healthy'::TEXT,
        jsonb_build_object(
            'active_subscriptions', (SELECT COUNT(*) FROM premium_subscriptions WHERE status = 'active'),
            'expired_subscriptions', (SELECT COUNT(*) FROM premium_subscriptions WHERE status = 'expired'),
            'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM premium_subscriptions WHERE status = 'active')
        ),
        NOW()
    UNION ALL
    SELECT 
        'Records'::TEXT,
        'healthy'::TEXT,
        jsonb_build_object(
            'total_records', (SELECT COUNT(*) FROM fuel_records),
            'records_today', (SELECT COUNT(*) FROM fuel_records WHERE created_at >= CURRENT_DATE),
            'avg_records_per_user', (SELECT ROUND(COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM profiles), 0), 2) FROM fuel_records)
        ),
        NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to optimize database
CREATE OR REPLACE FUNCTION optimize_database()
RETURNS TABLE(
    operation TEXT,
    result TEXT,
    details TEXT
) AS $$
BEGIN
    -- Analyze tables for better query planning
    ANALYZE profiles;
    ANALYZE fuel_records;
    ANALYZE premium_subscriptions;
    ANALYZE payments;
    ANALYZE usage_limits;
    ANALYZE admin_logs;
    
    RETURN QUERY
    SELECT 'ANALYZE'::TEXT, 'completed'::TEXT, 'Updated table statistics for query optimization'::TEXT
    UNION ALL
    SELECT 'VACUUM'::TEXT, 'skipped'::TEXT, 'Manual VACUUM required for space reclamation'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to send notification alerts
CREATE OR REPLACE FUNCTION check_system_alerts()
RETURNS TABLE(
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    -- Check for expiring premium subscriptions (next 7 days)
    SELECT 
        'premium_expiring'::TEXT,
        'warning'::TEXT,
        'Premium subscriptions expiring soon'::TEXT,
        COUNT(*)::INTEGER,
        NOW()
    FROM premium_subscriptions 
    WHERE status = 'active' 
    AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    HAVING COUNT(*) > 0
    
    UNION ALL
    
    -- Check for failed payments
    SELECT 
        'payment_failed'::TEXT,
        'error'::TEXT,
        'Failed payments requiring attention'::TEXT,
        COUNT(*)::INTEGER,
        NOW()
    FROM payments 
    WHERE status = 'failed' 
    AND created_at >= NOW() - INTERVAL '24 hours'
    HAVING COUNT(*) > 0
    
    UNION ALL
    
    -- Check for high usage users approaching limits
    SELECT 
        'usage_limit_warning'::TEXT,
        'info'::TEXT,
        'Users approaching usage limits'::TEXT,
        COUNT(*)::INTEGER,
        NOW()
    FROM usage_limits ul
    JOIN profiles p ON ul.user_id = p.id
    WHERE p.is_premium = FALSE
    AND ul.usage_count >= (ul.limit_count * 0.8)
    HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create scheduled cleanup job (requires pg_cron extension)
-- Note: This requires the pg_cron extension to be enabled
/*
-- Enable pg_cron extension (run as superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 2 AM
SELECT cron.schedule('daily-cleanup', '0 2 * * *', 'SELECT cleanup_expired_data();');

-- Schedule weekly analytics report on Mondays at 9 AM
SELECT cron.schedule('weekly-analytics', '0 9 * * 1', 'SELECT generate_analytics_report();');

-- Schedule monthly usage reset on 1st of each month at 1 AM
SELECT cron.schedule('monthly-reset', '0 1 1 * *', 'SELECT reset_monthly_usage_limits();');
*/

-- 9. Create manual maintenance commands
-- Run these manually as needed:

-- Daily maintenance
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    PERFORM cleanup_expired_data();
    PERFORM optimize_database();
    
    result := 'Daily maintenance completed at ' || NOW()::TEXT;
    
    -- Log maintenance action
    INSERT INTO admin_logs (admin_id, action, details)
    VALUES (
        NULL, -- System action
        'daily_maintenance',
        jsonb_build_object('completed_at', NOW(), 'type', 'automated')
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Weekly maintenance
CREATE OR REPLACE FUNCTION weekly_maintenance()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    PERFORM cleanup_expired_data();
    PERFORM optimize_database();
    
    -- Generate weekly report
    PERFORM generate_analytics_report(CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE);
    
    result := 'Weekly maintenance completed at ' || NOW()::TEXT;
    
    -- Log maintenance action
    INSERT INTO admin_logs (admin_id, action, details)
    VALUES (
        NULL, -- System action
        'weekly_maintenance',
        jsonb_build_object('completed_at', NOW(), 'type', 'automated')
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MAINTENANCE SCRIPTS COMPLETE!
-- =====================================================

-- Manual commands to run:

-- Daily cleanup:
-- SELECT daily_maintenance();

-- Check system health:
-- SELECT * FROM get_system_health();

-- Check alerts:
-- SELECT * FROM check_system_alerts();

-- Generate analytics report:
-- SELECT * FROM generate_analytics_report();

-- Backup specific user:
-- SELECT backup_user_data('user-uuid-here');

-- Optimize database:
-- SELECT * FROM optimize_database();
