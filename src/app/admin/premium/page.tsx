'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Crown,
  Calendar,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Gift
} from 'lucide-react'

interface PremiumUser {
  id: string
  email: string
  full_name: string
  is_premium: boolean
  premium_expires_at: string | null
  created_at: string
  premium_started_at: string | null
}

export default function AdminPremium() {
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [grantDuration, setGrantDuration] = useState<number>(30)
  const supabase = createClient()

  const fetchPremiumUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_premium', true)
        .order('premium_expires_at', { ascending: true })

      if (error) throw error
      setPremiumUsers(data || [])
    } catch (error) {
      console.error('Error fetching premium users:', error)
      toast.error('Failed to load premium users')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPremiumUsers()
  }, [fetchPremiumUsers])

  // duplicate fetchPremiumUsers removed; using useCallback version above

  const grantPremium = async (userId: string, days: number) => {
    try {
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: true,
          premium_expires_at: expiresAt,
          premium_started_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      toast.success(`Premium access granted for ${days} days`)
      fetchPremiumUsers()
      setShowGrantModal(false)
    } catch (error) {
      console.error('Error granting premium:', error)
      toast.error('Failed to grant premium access')
    }
  }

  const extendPremium = async (userId: string, days: number) => {
    try {
      // Get current expiry date
      const { data: user } = await supabase
        .from('profiles')
        .select('premium_expires_at')
        .eq('id', userId)
        .single()

      if (!user) throw new Error('User not found')

      // Calculate new expiry date
      const currentExpiry = user.premium_expires_at ? new Date(user.premium_expires_at) : new Date()
      const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000)

      const { error } = await supabase
        .from('profiles')
        .update({ premium_expires_at: newExpiry.toISOString() })
        .eq('id', userId)

      if (error) throw error

      toast.success(`Premium access extended by ${days} days`)
      fetchPremiumUsers()
    } catch (error) {
      console.error('Error extending premium:', error)
      toast.error('Failed to extend premium access')
    }
  }

  const revokePremium = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke premium access for this user?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: false,
          premium_expires_at: null
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('Premium access has been revoked')
      fetchPremiumUsers()
    } catch (error) {
      console.error('Error revoking premium:', error)
      toast.error('Failed to revoke premium access')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 0
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  // Calculate stats
  const totalPremiumUsers = premiumUsers.length
  const activePremiumUsers = premiumUsers.filter(u => !isExpired(u.premium_expires_at)).length
  const expiredPremiumUsers = premiumUsers.filter(u => isExpired(u.premium_expires_at)).length
  const totalRevenue = activePremiumUsers * 49000 // Mock calculation

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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Premium Management</h1>
                <p className="text-gray-400">
                  Manage premium subscriptions and user access
                </p>
              </div>
              <Button onClick={() => setShowGrantModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white">
                <Gift className="h-4 w-4 mr-2" />
                Grant Premium
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Premium Users</CardTitle>
                <Crown className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalPremiumUsers}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Premium</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePremiumUsers}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired Premium</CardTitle>
                <Calendar className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expiredPremiumUsers}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  }).format(totalRevenue)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Premium Users Table */}
          <Card className="mb-8 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Premium Users ({premiumUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Expires</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Days Left</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiumUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-yellow-600 flex items-center justify-center">
                                <Crown className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name || user.email}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isExpired(user.premium_expires_at)
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            <Crown className="h-3 w-3 mr-1" />
                            {isExpired(user.premium_expires_at) ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(user.premium_expires_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${
                            getDaysRemaining(user.premium_expires_at) <= 7
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {getDaysRemaining(user.premium_expires_at)} days
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => extendPremium(user.id, 30)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Extend 30d
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokePremium(user.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {premiumUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No premium users found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grant Premium Modal */}
          {showGrantModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowGrantModal(false)} />
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Grant Premium Access
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        User Email
                      </label>
                      <Input
                        placeholder="Enter user email"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration (days)
                      </label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={grantDuration}
                        onChange={(e) => setGrantDuration(parseInt(e.target.value) || 30)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowGrantModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedUser) {
                          // Find user by email and grant premium
                          // This is a simplified version - in real app, you'd search by email first
                          grantPremium(selectedUser, grantDuration)
                        }
                      }}
                    >
                      Grant Premium
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
