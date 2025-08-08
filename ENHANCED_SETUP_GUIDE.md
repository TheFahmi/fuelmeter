# 🚀 FuelMeter Enhanced Premium & Admin Setup Guide

Panduan lengkap untuk setup fitur premium dan admin yang telah ditingkatkan untuk FuelMeter.

## 📋 Overview

Sistem premium dan admin yang ditingkatkan ini mencakup:

### ✨ Fitur Premium Baru
- **Sistem Referral** - Bonus premium untuk referral
- **Kode Diskon** - Sistem kupon dan diskon
- **Achievement System** - Sistem pencapaian user
- **System Alerts** - Notifikasi sistem untuk admin
- **Enhanced Usage Limits** - Batasan penggunaan yang lebih fleksibel
- **Account Status Management** - Manajemen status akun (active, suspended, banned)
- **Trial System** - Sistem trial premium
- **Lifetime Subscriptions** - Langganan seumur hidup

### 🔐 Fitur Admin Baru
- **Enhanced Role System** - Role admin, moderator, premium_user
- **Permission System** - Sistem permission yang fleksibel
- **Admin Activity Logging** - Log aktivitas admin yang detail
- **System Health Monitoring** - Monitoring kesehatan sistem
- **Advanced Analytics** - Analitik yang lebih mendalam
- **Bulk Operations** - Operasi massal untuk admin

## 🚀 Setup Steps

### Prerequisites: Profiles Setup
**⚠️ PENTING:** Jalankan ini PERTAMA untuk membuat tabel `profiles` yang diperlukan:

```sql
-- 1. Jalankan setup profiles dan tabel dasar
-- Copy dan paste isi file: supabase_profiles_setup.sql
-- Ke Supabase SQL Editor dan klik "Run"
```

### Step 1: Run Enhanced Database Setup

Jalankan file SQL secara berurutan:

```sql
-- 2. Jalankan setup tabel dan struktur dasar
-- Copy dan paste isi file: supabase_premium_admin_enhanced.sql
-- Ke Supabase SQL Editor dan klik "Run"

-- 3. Jalankan setup fungsi-fungsi
-- Copy dan paste isi file: supabase_premium_admin_functions.sql
-- Ke Supabase SQL Editor dan klik "Run"

-- 4. Jalankan setup RLS policies
-- Copy dan paste isi file: supabase_premium_admin_rls.sql
-- Ke Supabase SQL Editor dan klik "Run"
```

### Step 2: Create Your First Admin User

1. **Register normally** melalui aplikasi dengan email Anda
2. **Jalankan SQL ini** (ganti dengan email Anda):

```sql
-- Buat diri Anda menjadi admin
SELECT make_user_admin(
    (SELECT id FROM profiles WHERE email = 'your-email@domain.com'),
    NULL,
    'admin',
    ARRAY['all']
);
```

### Step 3: Test Premium Features

```sql
-- Berikan premium 30 hari ke user test
SELECT grant_premium_subscription(
    (SELECT id FROM profiles WHERE email = 'test-user@email.com'),
    'monthly',
    30
);

-- Buat kode diskon
INSERT INTO discount_codes (code, description, discount_percentage, max_uses, valid_until) 
VALUES ('SAVE20', '20% off for new users', 20.00, 100, NOW() + INTERVAL '30 days');
```

## 📊 Database Schema Overview

### Tables Baru

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `discount_codes` | Kode diskon | Persentase diskon, batas penggunaan, validitas |
| `user_achievements` | Sistem pencapaian | Achievement type, metadata, earned_at |
| `system_alerts` | Notifikasi sistem | Target roles/users, severity, validitas |
| `premium_subscriptions` | Enhanced | Trial days, discount codes, auto-renew |
| `payments` | Enhanced | Refund support, payment data JSONB |
| `admin_logs` | Enhanced | Severity levels, IP tracking, user agent |
| `usage_limits` | Enhanced | Multiple reset periods, reset dates |

### Enhanced Columns di `profiles`

```sql
-- Kolom baru yang ditambahkan
is_premium BOOLEAN DEFAULT FALSE
premium_expires_at TIMESTAMPTZ
premium_started_at TIMESTAMPTZ
role TEXT DEFAULT 'user' -- 'user', 'admin', 'moderator', 'premium_user'
permissions TEXT[] DEFAULT '{}'
subscription_type TEXT -- 'monthly', 'yearly', 'lifetime', 'trial'
payment_method TEXT
last_payment_at TIMESTAMPTZ
trial_ends_at TIMESTAMPTZ
referral_code TEXT UNIQUE
referred_by UUID REFERENCES profiles(id)
referral_count INTEGER DEFAULT 0
total_referral_earnings DECIMAL(10,2) DEFAULT 0
last_activity_at TIMESTAMPTZ DEFAULT NOW()
account_status TEXT DEFAULT 'active' -- 'active', 'suspended', 'banned', 'pending_verification'
suspension_reason TEXT
suspension_ends_at TIMESTAMPTZ
```

## 🔧 Functions Overview

### Premium Functions

| Function | Purpose | Usage |
|----------|---------|-------|
| `is_user_premium(uuid)` | Check premium status | `SELECT is_user_premium('user-id')` |
| `get_user_usage(uuid, feature)` | Check usage limits | `SELECT * FROM get_user_usage('user-id', 'pdf_reports')` |
| `increment_usage(uuid, feature)` | Track feature usage | `SELECT increment_usage('user-id', 'ai_scans')` |
| `grant_premium_subscription()` | Grant premium | Admin panel integration |
| `revoke_premium_subscription()` | Revoke premium | Admin panel integration |
| `validate_discount_code()` | Validate discount | `SELECT * FROM validate_discount_code('SAVE20')` |
| `generate_referral_code()` | Generate referral | Auto-generated for new users |
| `apply_referral_bonus()` | Apply referral | Called when referral signs up |

### Admin Functions

| Function | Purpose | Usage |
|----------|---------|-------|
| `is_user_admin(uuid)` | Check admin status | `SELECT is_user_admin('user-id')` |
| `make_user_admin()` | Promote to admin | `SELECT make_user_admin('user-id', 'admin', ARRAY['all'])` |
| `remove_admin_privileges()` | Demote admin | `SELECT remove_admin_privileges('user-id')` |
| `log_admin_action()` | Log admin actions | Automatic logging |
| `get_system_health()` | System monitoring | `SELECT * FROM get_system_health()` |
| `generate_analytics_report()` | Analytics | `SELECT * FROM generate_analytics_report()` |
| `cleanup_expired_subscriptions()` | Maintenance | `SELECT cleanup_expired_subscriptions()` |
| `reset_usage_limits()` | Reset limits | `SELECT reset_usage_limits()` |

## 🛡️ Security Features

### Row Level Security (RLS)

Semua tabel sensitif memiliki RLS yang ditingkatkan:

- **User Isolation** - User hanya bisa melihat data mereka sendiri
- **Admin Access** - Admin bisa melihat semua data
- **Role-based Access** - Akses berdasarkan role
- **Feature-based Policies** - Policy berdasarkan fitur

### Permission System

```sql
-- Role hierarchy
'user'         -- Regular user
'premium_user' -- Premium user (auto-assigned)
'moderator'    -- Limited admin access
'admin'        -- Full admin access

-- Permission examples
permissions = ARRAY['all']                    -- Full access
permissions = ARRAY['users', 'analytics']    -- Limited access
permissions = ARRAY['reports', 'settings']   -- Specific access
```

### Account Status Management

```sql
-- Account statuses
'active'              -- Normal user
'pending_verification' -- Email verification pending
'suspended'           -- Temporarily suspended
'banned'              -- Permanently banned
```

## 📈 Usage Examples

### Admin Operations

```sql
-- Promote user to admin
SELECT make_user_admin('user-uuid', 'admin', ARRAY['all']);

-- Grant premium with discount
SELECT grant_premium_subscription(
    'user-uuid', 
    'monthly', 
    30, 
    'admin-uuid', 
    NULL, 
    'SAVE20'
);

-- Suspend user account
UPDATE profiles 
SET account_status = 'suspended', 
    suspension_reason = 'Violation of terms',
    suspension_ends_at = NOW() + INTERVAL '7 days'
WHERE id = 'user-uuid';

-- Create system alert
INSERT INTO system_alerts (
    alert_type, 
    title, 
    message, 
    severity, 
    target_roles
) VALUES (
    'maintenance',
    'Scheduled Maintenance',
    'System will be down for maintenance on Sunday 2-4 AM',
    'info',
    ARRAY['user', 'premium_user']
);
```

### Premium Features

```sql
-- Check if user can use AI scanner
SELECT * FROM get_user_usage('user-uuid', 'ai_scans');

-- Increment usage after using feature
SELECT increment_usage('user-uuid', 'pdf_reports');

-- Apply referral bonus
SELECT apply_referral_bonus('referrer-uuid', 'referred-uuid');

-- Validate discount code
SELECT * FROM validate_discount_code('SAVE20');
```

### Analytics & Monitoring

```sql
-- Get system health
SELECT * FROM get_system_health();

-- Generate 30-day analytics
SELECT * FROM generate_analytics_report(
    CURRENT_DATE - INTERVAL '30 days', 
    CURRENT_DATE
);

-- Get user analytics
SELECT 
    p.email,
    p.is_premium,
    p.role,
    p.referral_count,
    p.total_referral_earnings,
    COUNT(fr.id) as total_records,
    COALESCE(SUM(fr.total_cost), 0) as total_spent
FROM profiles p
LEFT JOIN fuel_records fr ON p.id = fr.user_id
GROUP BY p.id, p.email, p.is_premium, p.role, p.referral_count, p.total_referral_earnings
ORDER BY total_spent DESC;
```

## 🔄 Maintenance Commands

### Daily Maintenance

```sql
-- Cleanup expired subscriptions
SELECT cleanup_expired_subscriptions();

-- Reset usage limits
SELECT reset_usage_limits();

-- Check system health
SELECT * FROM get_system_health();
```

### Weekly Maintenance

```sql
-- Generate weekly report
SELECT * FROM generate_analytics_report(
    CURRENT_DATE - INTERVAL '7 days', 
    CURRENT_DATE
);

-- Clean old admin logs (older than 6 months)
DELETE FROM admin_logs 
WHERE created_at < NOW() - INTERVAL '6 months';
```

### Monthly Maintenance

```sql
-- Generate monthly report
SELECT * FROM generate_analytics_report(
    CURRENT_DATE - INTERVAL '30 days', 
    CURRENT_DATE
);

-- Update app settings
UPDATE app_settings 
SET value = '59000' 
WHERE key = 'premium_monthly_price';
```

## 🎯 Configuration

### App Settings

Key settings yang bisa dimodifikasi:

```sql
-- Pricing
'premium_monthly_price'    -- 49000 IDR
'premium_yearly_price'     -- 490000 IDR  
'premium_lifetime_price'   -- 1500000 IDR
'trial_days'              -- 7 days

-- Usage Limits
'free_pdf_limit'          -- 3 per month
'free_scan_limit'         -- 3 per month
'free_export_limit'       -- 1 per month
'free_api_limit'          -- 100 per day

-- Referral System
'referral_bonus_days'     -- 30 days
'max_referral_bonus'      -- 90 days

-- Security
'session_timeout_hours'   -- 24 hours
'password_min_length'     -- 8 characters
'rate_limit_requests'     -- 100 per minute
```

### Usage Limits

Default limits untuk free users:
- 📄 PDF Reports: 3 per month
- 🤖 AI Scans: 3 per month
- 📤 Data Export: 1 per month
- 🔌 API Calls: 100 per day
- 📊 Advanced Analytics: 5 per month

## 🚨 Troubleshooting

### Common Issues

1. **Admin access not working**
   ```sql
   -- Check user role and permissions
   SELECT role, permissions, account_status 
   FROM profiles 
   WHERE email = 'your-email';
   ```

2. **Premium not activating**
   ```sql
   -- Check premium status
   SELECT is_premium, premium_expires_at, account_status 
   FROM profiles 
   WHERE email = 'user-email';
   ```

3. **Usage limits not resetting**
   ```sql
   -- Manual reset
   SELECT reset_usage_limits();
   
   -- Check reset dates
   SELECT * FROM usage_limits 
   WHERE user_id = 'user-uuid';
   ```

4. **RLS policies not working**
   ```sql
   -- Check if RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'premium_subscriptions';
   ```

### Reset Commands

```sql
-- Reset all usage limits
UPDATE usage_limits 
SET usage_count = 0, last_reset_at = NOW();

-- Clean expired subscriptions
SELECT cleanup_expired_subscriptions();

-- Reset user account status
UPDATE profiles 
SET account_status = 'active', 
    suspension_reason = NULL, 
    suspension_ends_at = NULL
WHERE email = 'user@email.com';
```

## 🔧 Troubleshooting

### Common Errors

#### Error: `relation "profiles" does not exist`
**Cause:** Tabel `profiles` belum dibuat sebelum menjalankan script premium.

**Solution:**
```sql
-- Jalankan ini PERTAMA
\i supabase_profiles_setup.sql
```

#### Error: `function "is_user_premium" does not exist`
**Cause:** Functions belum dibuat.

**Solution:**
```sql
-- Jalankan setup functions
\i supabase_premium_admin_functions.sql
```

#### Error: `policy "Users can view own profiles" already exists`
**Cause:** RLS policies sudah ada.

**Solution:**
```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profiles" ON profiles;
-- Then run the RLS setup
\i supabase_premium_admin_rls.sql
```

### Verification Queries

```sql
-- Check if profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
);

-- Check if all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'premium_subscriptions', 'payments', 
    'admin_logs', 'usage_limits', 'discount_codes',
    'user_achievements', 'system_alerts', 'app_settings'
)
ORDER BY table_name;

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'is_user_premium', 'is_user_admin', 'get_user_usage',
    'increment_usage', 'grant_premium_subscription'
)
ORDER BY routine_name;
```

## 📝 Migration Notes

### From Old System

Jika Anda sudah memiliki sistem premium yang lama:

1. **Backup existing data**
   ```sql
   -- Backup current premium data
   CREATE TABLE premium_backup AS 
   SELECT * FROM profiles WHERE is_premium = TRUE;
   ```

2. **Run migration scripts**
   ```sql
   -- Run the enhanced setup scripts
   -- They use IF NOT EXISTS to avoid conflicts
   ```

3. **Verify migration**
   ```sql
   -- Check if all data migrated correctly
   SELECT COUNT(*) FROM profiles WHERE is_premium = TRUE;
   SELECT COUNT(*) FROM premium_subscriptions WHERE status = 'active';
   ```

### Data Validation

```sql
-- Validate premium users
SELECT 
    p.email,
    p.is_premium,
    p.premium_expires_at,
    ps.status as subscription_status,
    ps.expires_at as subscription_expires
FROM profiles p
LEFT JOIN premium_subscriptions ps ON p.id = ps.user_id
WHERE p.is_premium = TRUE;
```

## 🔄 Scheduled Tasks (Optional)

Jika Anda memiliki pg_cron extension:

```sql
-- Enable extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup
SELECT cron.schedule('daily-cleanup', '0 2 * * *', 'SELECT cleanup_expired_subscriptions();');

-- Schedule usage limit reset
SELECT cron.schedule('monthly-reset', '0 0 1 * *', 'SELECT reset_usage_limits();');

-- Schedule health check
SELECT cron.schedule('health-check', '0 */6 * * *', 'SELECT * FROM get_system_health();');
```

## 📞 Support

Jika Anda mengalami masalah:

1. **Check troubleshooting section** di atas
2. **Review Supabase logs** di dashboard
3. **Verify RLS policies** dengan test queries
4. **Check function permissions** dengan `\df+ function_name`
5. **Validate data integrity** dengan migration checks

## 🎉 Setup Complete!

Sistem premium dan admin yang ditingkatkan Anda sekarang siap digunakan dengan:

- ✅ **Enhanced Security** - RLS policies yang lebih ketat
- ✅ **Referral System** - Sistem referral otomatis
- ✅ **Discount Codes** - Sistem kupon fleksibel
- ✅ **Achievement System** - Sistem pencapaian user
- ✅ **Advanced Analytics** - Analitik yang mendalam
- ✅ **System Monitoring** - Monitoring kesehatan sistem
- ✅ **Bulk Operations** - Operasi massal untuk admin
- ✅ **Account Management** - Manajemen status akun
- ✅ **Usage Tracking** - Tracking penggunaan yang detail

---

**🚀 Selamat! Sistem FuelMeter Anda sekarang memiliki fitur premium dan admin yang canggih!** 