'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Users,
  FileText,
  Crown,
  DollarSign,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  premiumUsers: number
  totalRecords: number
  totalRevenue: number
  newUsersToday: number
  recordsToday: number
  conversionRate: number
  activeUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    premiumUsers: 0,
    totalRecords: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    recordsToday: 0,
    conversionRate: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<{
    id: string
    created_at: string
    total_cost: number
    profiles: { email: string } | null
  }[]>([])
  const supabase = createClient()


  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch users stats
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, is_premium, created_at')

      if (usersError) throw usersError

      // Fetch fuel records stats
      const { data: records, error: recordsError } = await supabase
        .from('fuel_records')
        .select('id, created_at, total_cost')

      if (recordsError) throw recordsError

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const totalUsers = users?.length || 0
      const premiumUsers = users?.filter(u => u.is_premium).length || 0
      const totalRecords = records?.length || 0
      const newUsersToday = users?.filter(u => 
        new Date(u.created_at) >= today
      ).length || 0
      const recordsToday = records?.filter(r => 
        new Date(r.created_at) >= today
      ).length || 0

      // Calculate active users (created within last 7 days as fallback)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const activeUsers = users?.filter(u =>
        new Date(u.created_at) >= weekAgo
      ).length || 0

      // Calculate total revenue (mock calculation)
      const totalRevenue = premiumUsers * 49000 // Assuming monthly premium

      // Calculate conversion rate
      const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0

      const statsData = {
        totalUsers,
        premiumUsers,
        totalRecords,
        totalRevenue,
        newUsersToday,
        recordsToday,
        conversionRate,
        activeUsers
      }

      console.log('Dashboard Stats:', statsData)
      setStats(statsData)

      // Fetch recent activity
      const { data: activity } = await supabase
        .from('fuel_records')
        .select(`
          id,
          created_at,
          total_cost,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get user emails for recent activity
      const activityWithUsers = await Promise.all(
        (activity || []).map(async (record) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', record.user_id)
            .single()

          return {
            ...record,
            profiles: profile
          }
        })
      )

      setRecentActivity(activityWithUsers)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor your FuelMeter application performance and user activity
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers?.toLocaleString() || '0'}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  +{stats.newUsersToday || 0} today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Premium Users</CardTitle>
                <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.premiumUsers.toLocaleString()}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stats.conversionRate.toFixed(1)}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Fuel Records</CardTitle>
                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRecords.toLocaleString()}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  +{stats.recordsToday} today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Monthly recurring revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Activity className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{stats.activeUsers}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Users active in the last 7 days
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg. records per user:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.totalUsers > 0 ? (stats.totalRecords / stats.totalUsers).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Premium conversion:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">User retention:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Calendar className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          New fuel record by {activity.profiles?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(activity.total_cost)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
