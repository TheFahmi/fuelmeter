-- Add is_admin column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create admin user (replace with your email)
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'your-admin-email@example.com';

-- Create RLS policy for admin access
CREATE POLICY "Admin can access all profiles" ON profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = TRUE
        )
    );

-- Grant admin users access to all tables
CREATE POLICY "Admin can access all fuel_records" ON fuel_records
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = TRUE
        )
    );

CREATE POLICY "Admin can access all user_settings" ON user_settings
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = TRUE
        )
    );

-- Create admin function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
