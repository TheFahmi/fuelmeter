/**
 * Script to setup the first admin user
 * Run this script after creating your first user account
 */

import { createClient } from '@/lib/supabase'

async function setupFirstAdmin() {
  const supabase = createClient()

  try {
    // Get the current user (you need to be logged in)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('No user logged in. Please login first.')
      return
    }

    console.log('Setting up admin for user:', user.email)

    // Add is_admin column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })

    if (alterError) {
      console.log('Column might already exist or manual setup needed:', alterError.message)
    }

    // Make current user admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error making user admin:', updateError)
      return
    }

    console.log('✅ Successfully set up admin user!')
    console.log('You can now access the admin panel at /admin')

  } catch (error) {
    console.error('Error setting up admin:', error)
  }
}

// Manual setup instructions
console.log(`
🔧 ADMIN SETUP INSTRUCTIONS:

1. First, make sure you have a user account created
2. Login to your account
3. Run this script or manually execute the SQL:

   -- Add is_admin column
   ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
   
   -- Make your user admin (replace with your email)
   UPDATE profiles SET is_admin = TRUE WHERE email = 'your-email@example.com';

4. Access admin panel at /admin

📝 Note: You can also run this in Supabase SQL Editor:
   UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-id';
`)

// Uncomment the line below to run the setup
// setupFirstAdmin()

export { setupFirstAdmin }
