'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AdminContextType {
  isAdmin: boolean
  isLoading: boolean
  adminData: {
    id: string
    email: string
    role: string
    permissions: string[]
  } | null
  checkAdminAccess: () => Promise<boolean>
  logout: () => Promise<void>
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isLoading: true,
  adminData: null,
  checkAdminAccess: async () => false,
  logout: async () => {}
})

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

interface AdminProviderProps {
  children: ReactNode
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adminData, setAdminData] = useState<AdminContextType['adminData']>(null)
  const supabase = createClient()
  const router = useRouter()

  const checkAdminAccess = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsAdmin(false)
        setAdminData(null)
        return false
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, role, permissions')
        .eq('id', user.id)
        .single()

      if (profile && profile.role === 'admin') {
        setIsAdmin(true)
        setAdminData({
          id: profile.id,
          email: profile.email,
          role: profile.role,
          permissions: profile.permissions || []
        })
        return true
      } else {
        setIsAdmin(false)
        setAdminData(null)
        return false
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      setIsAdmin(false)
      setAdminData(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  // checkAdminAccess defined with useCallback above

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setIsAdmin(false)
      setAdminData(null)
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <AdminContext.Provider value={{
      isAdmin,
      isLoading,
      adminData,
      checkAdminAccess,
      logout
    }}>
      {children}
    </AdminContext.Provider>
  )
}

// Admin Route Guard Component
interface AdminGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAdmin, isLoading } = useAdmin()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
