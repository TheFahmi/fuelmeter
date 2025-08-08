'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// import { createClient } from '@/lib/supabase' // Not used in this component
import { checkAdminStatus, getCurrentUser } from '@/lib/admin-utils'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  // const supabase = createClient() // Not used in this component

  const checkAdminAccess = useCallback(async () => {
    try {
      const user = await getCurrentUser()

      if (!user) {
        router.push('/login')
        return
      }

      const isAdmin = await checkAdminStatus(user.id)

      if (!isAdmin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error('Error in admin guard:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  // checkAdminAccess defined with useCallback above

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don&apos;t have permission to access this area.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
