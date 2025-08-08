import { createClient } from '@/lib/supabase'

export async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    // Check if user has admin or moderator role
    return data?.role === 'admin' || data?.role === 'moderator'
  } catch (error) {
    console.error('Error in checkAdminStatus:', error)
    return false
  }
}

export async function makeUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)

    if (error) {
      console.error('Error making user admin:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in makeUserAdmin:', error)
    return false
  }
}

export async function removeAdminAccess(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userId)

    if (error) {
      console.error('Error removing admin access:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in removeAdminAccess:', error)
    return false
  }
}

export async function getCurrentUser() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return false
    }

    return await checkAdminStatus(user.id)
  } catch (error) {
    console.error('Error in isCurrentUserAdmin:', error)
    return false
  }
}

export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error getting user role:', error)
      return null
    }

    return data?.role || 'user'
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return null
  }
}

export async function updateUserRole(userId: string, role: 'user' | 'admin' | 'moderator' | 'premium_user'): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return false
  }
}
