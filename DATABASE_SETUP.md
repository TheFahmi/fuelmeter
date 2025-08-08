# FuelMeter Database Setup Guide

This guide will help you set up the complete database structure for FuelMeter with premium features and admin functionality.

## 📋 Prerequisites

- Supabase project created
- Database access (SQL Editor in Supabase Dashboard)
- Basic understanding of PostgreSQL

## 🚀 Setup Steps

### Step 1: Run Main Database Setup

Execute the main SQL script to create all tables, functions, and policies:

```sql
-- Copy and paste the entire content of supabase_premium_admin.sql
-- into Supabase SQL Editor and run it
```

This script will create:
- ✅ Premium columns in `profiles` table
- ✅ `premium_subscriptions` table
- ✅ `payments` table  
- ✅ `admin_logs` table
- ✅ `app_settings` table
- ✅ `usage_limits` table
- ✅ All necessary indexes
- ✅ Row Level Security policies
- ✅ Helper functions

### Step 2: Initialize Default Data

Execute the initial data script:

```sql
-- Copy and paste the entire content of supabase_initial_data.sql
-- into Supabase SQL Editor and run it
```

This script will:
- ✅ Insert default app settings
- ✅ Create user setup triggers
- ✅ Add helper functions for admin actions
- ✅ Create analytics views

### Step 3: Create Your First Admin User

1. **Register normally** through your app with your email
2. **Run this SQL** (replace with your actual email):

```sql
-- Make yourself admin
UPDATE profiles 
SET 
    role = 'admin',
    permissions = ARRAY['all'],
    updated_at = NOW()
WHERE email = 'your-email@domain.com';
```

### Step 4: Test Premium Features

Grant premium to a test user:

```sql
-- Grant 30 days premium to a user
SELECT grant_premium_subscription(
    (SELECT id FROM profiles WHERE email = 'test-user@email.com'),
    'monthly',
    30
);
```

## 📊 Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User profiles | Premium status, role, permissions |
| `fuel_records` | Fuel consumption data | User's fuel tracking records |
| `premium_subscriptions` | Subscription tracking | Active/expired subscriptions |
| `payments` | Payment history | Transaction records |
| `usage_limits` | Feature usage tracking | Free tier limitations |
| `admin_logs` | Admin activity logs | Audit trail |
| `app_settings` | System configuration | App-wide settings |

### Key Functions

| Function | Purpose | Usage |
|----------|---------|-------|
| `is_user_premium(uuid)` | Check premium status | `SELECT is_user_premium('user-id')` |
| `is_user_admin(uuid)` | Check admin status | `SELECT is_user_admin('user-id')` |
| `grant_premium_subscription()` | Grant premium access | Admin panel integration |
| `get_user_usage()` | Check usage limits | Feature gating |
| `increment_usage()` | Track feature usage | PDF/AI scan counting |

### Analytics Views

| View | Purpose | Usage |
|------|---------|-------|
| `admin_dashboard_stats` | Dashboard metrics | `SELECT * FROM admin_dashboard_stats` |
| `user_analytics` | User behavior data | `SELECT * FROM user_analytics` |

## 🔐 Security Features

### Row Level Security (RLS)

All sensitive tables have RLS enabled:
- Users can only see their own data
- Admins can see all data
- Automatic policy enforcement

### Permission System

```sql
-- User roles
'user'      -- Regular user
'admin'     -- Full admin access
'moderator' -- Limited admin access

-- Permissions array
permissions = ARRAY['all']                    -- Full access
permissions = ARRAY['users', 'analytics']    -- Limited access
```

## 🛠️ Maintenance Commands

### Daily Maintenance

```sql
-- Run daily cleanup
SELECT daily_maintenance();
```

### Check System Health

```sql
-- Get system status
SELECT * FROM get_system_health();
```

### Check Alerts

```sql
-- Check for issues
SELECT * FROM check_system_alerts();
```

### Generate Analytics

```sql
-- Generate 30-day report
SELECT * FROM generate_analytics_report();
```

## 📈 Usage Examples

### Admin Operations

```sql
-- Make user admin
SELECT make_user_admin('user-uuid');

-- Grant premium (30 days)
SELECT grant_premium_subscription('user-uuid', 'monthly', 30);

-- Revoke premium
SELECT revoke_premium_subscription('user-uuid');

-- Remove admin privileges
SELECT remove_admin_privileges('user-uuid');
```

### Check User Status

```sql
-- Check if user is premium
SELECT is_user_premium('user-uuid');

-- Check user's usage limits
SELECT * FROM get_user_usage('user-uuid', 'pdf_reports');

-- Get user analytics
SELECT * FROM user_analytics WHERE id = 'user-uuid';
```

### System Monitoring

```sql
-- Dashboard stats
SELECT * FROM admin_dashboard_stats;

-- Recent admin actions
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 10;

-- Active subscriptions
SELECT * FROM premium_subscriptions WHERE status = 'active';
```

## 🔧 Configuration

### App Settings

Key settings you can modify:

```sql
-- Update premium pricing
UPDATE app_settings 
SET value = '59000' 
WHERE key = 'premium_monthly_price';

-- Change free limits
UPDATE app_settings 
SET value = '5' 
WHERE key = 'free_pdf_limit';

-- Enable maintenance mode
UPDATE app_settings 
SET value = 'true' 
WHERE key = 'maintenance_mode';
```

### Usage Limits

Default limits for free users:
- 📄 PDF Reports: 3 per month
- 🤖 AI Scans: 3 per month
- 📤 Data Export: 1 per month
- 🔌 API Calls: 100 per day

## 🚨 Troubleshooting

### Common Issues

1. **Admin access not working**
   ```sql
   -- Check user role
   SELECT role, permissions FROM profiles WHERE email = 'your-email';
   ```

2. **Premium not activating**
   ```sql
   -- Check premium status
   SELECT is_premium, premium_expires_at FROM profiles WHERE email = 'user-email';
   ```

3. **Usage limits not resetting**
   ```sql
   -- Manual reset
   SELECT reset_monthly_usage_limits();
   ```

### Reset Commands

```sql
-- Reset all usage limits
UPDATE usage_limits SET usage_count = 0, last_reset_at = NOW();

-- Clean expired subscriptions
SELECT cleanup_expired_data();

-- Optimize database
SELECT * FROM optimize_database();
```

## 📝 Notes

- Always backup before running maintenance scripts
- Test admin functions on staging first
- Monitor system health regularly
- Keep app settings updated
- Review admin logs periodically

## 🔄 Scheduled Tasks (Optional)

If you have pg_cron extension:

```sql
-- Enable extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup
SELECT cron.schedule('daily-cleanup', '0 2 * * *', 'SELECT daily_maintenance();');
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Supabase logs
3. Verify RLS policies
4. Check function permissions

---

**🎉 Setup Complete!**

Your FuelMeter database is now ready with full premium and admin functionality!
