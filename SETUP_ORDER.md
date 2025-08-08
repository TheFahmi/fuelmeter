# 🚀 FuelMeter SQL Setup Order

## ⚠️ Important: Run Scripts in This Order

### 1. Prerequisites (Run FIRST)
```sql
-- Copy and paste the contents of this file into Supabase SQL Editor
-- supabase_profiles_setup.sql
```
**Purpose:** Creates the `profiles` table and other basic tables needed for the premium system.

### 2. Enhanced Premium & Admin Setup
```sql
-- Copy and paste the contents of this file into Supabase SQL Editor
-- supabase_premium_admin_enhanced.sql
```
**Purpose:** Creates premium and admin tables, modifies existing tables.

### 3. Functions Setup
```sql
-- Copy and paste the contents of this file into Supabase SQL Editor
-- supabase_premium_admin_functions.sql
```
**Purpose:** Creates all the PL/pgSQL functions for premium and admin features.

### 4. RLS Policies Setup
```sql
-- Copy and paste the contents of this file into Supabase SQL Editor
-- supabase_premium_admin_rls.sql
```
**Purpose:** Sets up Row Level Security policies for all tables.

## 🔧 If You Get Errors

### Error: `relation "profiles" does not exist`
**Solution:** You skipped step 1. Go back and run `supabase_profiles_setup.sql` first.

### Error: `function "is_user_premium" does not exist`
**Solution:** You skipped step 3. Run `supabase_premium_admin_functions.sql`.

### Error: `policy already exists`
**Solution:** The policies already exist. You can safely ignore this error or drop existing policies first.

## ✅ Verification

After running all scripts, verify the setup:

```sql
-- Check if profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
);

-- Check all required tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'premium_subscriptions', 'payments', 
    'admin_logs', 'usage_limits', 'discount_codes',
    'user_achievements', 'system_alerts', 'app_settings'
)
ORDER BY table_name;
```

## 📖 Full Documentation

For complete documentation, see: `ENHANCED_SETUP_GUIDE.md` 