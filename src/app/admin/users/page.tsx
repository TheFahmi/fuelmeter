'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/contexts/toast-context'
import {
  Search,
  Crown,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  is_premium: boolean
  premium_expires_at: string | null
  role: string
  created_at: string
  fuel_records_count: number
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'free' | 'admin'>('all')
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          is_premium,
          premium_expires_at,
          role,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('fuel_records')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)

          return {
            ...profile,
            fuel_records_count: count || 0
          }
        })
      )

      setUsers(usersWithCounts)
    } catch (error) {
      console.error('Error fetching users:', error)
      showError('Error', 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const filterUsers = useCallback(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch (filterType) {
      case 'premium':
        filtered = filtered.filter(user => user.is_premium)
        break
      case 'free':
        filtered = filtered.filter(user => !user.is_premium)
        break
      case 'admin':
        filtered = filtered.filter(user => user.role === 'admin')
        break
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterType])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    filterUsers()
  }, [filterUsers])
  // duplicate fetchUsers/filterUsers removed; using useCallback versions above

  const togglePremiumStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      const expiresAt = newStatus ? 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // 30 days from now
        null

      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: newStatus,
          premium_expires_at: expiresAt
        })
        .eq('id', userId)

      if (error) throw error

      success(
        'Premium Status Updated',
        `User premium status has been ${newStatus ? 'activated' : 'deactivated'}`
      )
      
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error updating premium status:', error)
      showError('Error', 'Failed to update premium status')
    }
  }

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin'

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      success(
        'Role Updated',
        `User role has been changed to ${newRole}`
      )
      
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error)
      showError('Error', 'Failed to update user role')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isPremiumExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage user accounts, premium subscriptions, and permissions
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterType === 'all' ? 'primary' : 'outline'}
                    onClick={() => setFilterType('all')}
                    size="sm"
                  >
                    All ({users.length})
                  </Button>
                  <Button
                    variant={filterType === 'premium' ? 'primary' : 'outline'}
                    onClick={() => setFilterType('premium')}
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Premium ({users.filter(u => u.is_premium).length})
                  </Button>
                  <Button
                    variant={filterType === 'free' ? 'primary' : 'outline'}
                    onClick={() => setFilterType('free')}
                    size="sm"
                  >
                    Free ({users.filter(u => !u.is_premium).length})
                  </Button>
                  <Button
                    variant={filterType === 'admin' ? 'primary' : 'outline'}
                    onClick={() => setFilterType('admin')}
                    size="sm"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin ({users.filter(u => u.role === 'admin').length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Records</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name || user.email}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {user.role === 'admin' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </span>
                            )}
                            {user.is_premium ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isPremiumExpired(user.premium_expires_at)
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                <Crown className="h-3 w-3 mr-1" />
                                {isPremiumExpired(user.premium_expires_at) ? 'Expired' : 'Premium'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                Free
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.fuel_records_count}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(user.created_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePremiumStatus(user.id, user.is_premium)}
                            >
                              {user.is_premium ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  Remove Premium
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Make Premium
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleUserRole(user.id, user.role)}
                            >
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No users found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
