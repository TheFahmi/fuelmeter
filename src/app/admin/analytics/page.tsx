'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface AnalyticsData {
  userGrowth: {
    month: string
    users: number
    premium: number
  }[]
  fuelUsage: {
    fuelType: string
    count: number
    totalLiters: number
  }[]
  stationPopularity: {
    station: string
    count: number
    percentage: number
  }[]
  monthlyRevenue: {
    month: string
    revenue: number
  }[]
  topUsers: {
    email: string
    recordCount: number
    totalSpent: number
  }[]
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    fuelUsage: [],
    stationPopularity: [],
    monthlyRevenue: [],
    topUsers: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)

      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, is_premium, created_at')

      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')

      if (users && records) {
        const userGrowthMap = new Map()
        users.forEach(user => {
          const month = new Date(user.created_at).toISOString().slice(0, 7)
          if (!userGrowthMap.has(month)) {
            userGrowthMap.set(month, { users: 0, premium: 0 })
          }
          userGrowthMap.get(month).users++
          if (user.is_premium) {
            userGrowthMap.get(month).premium++
          }
        })

        const userGrowth = Array.from(userGrowthMap.entries())
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12)

        const fuelUsageMap = new Map()
        records.forEach(record => {
          if (!fuelUsageMap.has(record.fuel_type)) {
            fuelUsageMap.set(record.fuel_type, { count: 0, totalLiters: 0 })
          }
          fuelUsageMap.get(record.fuel_type).count++
          fuelUsageMap.get(record.fuel_type).totalLiters += record.quantity
        })

        const fuelUsage = Array.from(fuelUsageMap.entries())
          .map(([fuelType, data]) => ({ fuelType, ...data }))
          .sort((a, b) => b.count - a.count)

        const stationMap = new Map()
        records.forEach(record => {
          stationMap.set(record.station, (stationMap.get(record.station) || 0) + 1)
        })

        const totalRecords = records.length
        const stationPopularity = Array.from(stationMap.entries())
          .map(([station, count]) => ({
            station,
            count,
            percentage: (count / totalRecords) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        const monthlyRevenueMap = new Map()
        users.forEach(user => {
          if (user.is_premium) {
            const month = new Date(user.created_at).toISOString().slice(0, 7)
            monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + 49000)
          }
        })

        const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12)

        const userSpendingMap = new Map()
        records.forEach(record => {
          if (!userSpendingMap.has(record.user_id)) {
            userSpendingMap.set(record.user_id, { recordCount: 0, totalSpent: 0, email: '' })
          }
          userSpendingMap.get(record.user_id).recordCount++
          userSpendingMap.get(record.user_id).totalSpent += record.total_cost
        })

        users.forEach(user => {
          if (userSpendingMap.has(user.id)) {
            userSpendingMap.get(user.id).email = user.email
          }
        })

        const topUsers = Array.from(userSpendingMap.values())
          .filter(user => user.email)
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10)

        setAnalytics({
          userGrowth,
          fuelUsage,
          stationPopularity,
          monthlyRevenue,
          topUsers
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // fetchAnalytics defined with useCallback above

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatMonth = (monthString: string) => {
    return new Date(monthString + '-01').toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short'
    })
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive insights into user behavior and platform performance
            </p>
          </div>

          {/* User Growth Chart */}
          <Card className="mb-8 bg-gray-800 border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                User Growth (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.userGrowth.map((data, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-600 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-white">
                        {formatMonth(data.month)}
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-sm text-gray-400">
                          Total: {data.users}
                        </span>
                        <span className="text-sm text-yellow-400">
                          Premium: {data.premium}
                        </span>
                      </div>
                    </div>
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((data.users / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fuel Usage and Station Popularity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Fuel Usage */}
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <PieChart className="h-5 w-5 mr-2 text-blue-400" />
                  Fuel Type Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.fuelUsage.slice(0, 8).map((fuel, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-white">
                          {fuel.fuelType}
                        </span>
                        <div className="text-xs text-gray-400">
                          {fuel.totalLiters.toFixed(1)}L total
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">
                          {fuel.count} records
                        </span>
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ 
                              width: `${(fuel.count / Math.max(...analytics.fuelUsage.map(f => f.count))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Station Popularity */}
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-400" />
                  Popular Stations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.stationPopularity.slice(0, 8).map((station, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {station.station}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {station.percentage.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${station.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue and Top Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Revenue */}
            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.monthlyRevenue.slice(-6).map((revenue, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatMonth(revenue.month)}
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(revenue.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Top Users by Spending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topUsers.slice(0, 8).map((user, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.email}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.recordCount} records
                        </div>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(user.totalSpent)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
