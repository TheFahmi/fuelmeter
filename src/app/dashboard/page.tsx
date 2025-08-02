'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BurgerMenu } from '@/components/ui/menu'
import { Plus, BarChart3, List, TrendingUp, Calendar, Target } from 'lucide-react'
import { BudgetTracker } from '@/components/budget-tracker'
import { SmartReminders } from '@/components/smart-reminders'
import { AdvancedStats } from '@/components/advanced-stats'
import { AchievementSystem } from '@/components/achievement-system'
import { ReceiptScanner } from '@/components/receipt-scanner'
import { VehicleManager } from '@/components/vehicle-manager'
import { CarbonFootprint } from '@/components/carbon-footprint'
import { PDFExport } from '@/components/pdf-export'
import { Challenges } from '@/components/challenges'
import { Notifications } from '@/components/notifications'
import { AdvancedAnalytics } from '@/components/advanced-analytics'

interface UserSettings {
  display_name?: string
  vehicle_type?: string
}

interface FuelRecord {
  id: string
  date: string
  fuel_type: string
  quantity: number
  price_per_liter: number
  total_cost: number
  distance_km: number
  odometer_km: number
  station: string
  created_at: string
}

interface Stats {
  totalRecords: number
  totalCost: number
  averagePrice: number
  totalQuantity: number
  totalDistance: number
  averageCostPerKm: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    totalCost: 0,
    averagePrice: 0,
    totalQuantity: 0,
    totalDistance: 0,
    averageCostPerKm: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
    }
  }, [supabase, router])

  const fetchFuelRecords = useCallback(async () => {
    try {
      const { data: records, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      calculateStats(records || [])
    } catch (error) {
      console.error('Error fetching fuel records:', error)
    }
  }, [supabase])

  const fetchUserSettings = useCallback(async () => {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('display_name, vehicle_type')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user settings:', error)
      } else {
        setUserSettings(settings || {})
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }, [supabase])

  const calculateStats = (records: FuelRecord[]) => {
    if (records.length === 0) {
      setStats({
        totalRecords: 0,
        totalCost: 0,
        averagePrice: 0,
        totalQuantity: 0,
        totalDistance: 0,
        averageCostPerKm: 0
      })
      return
    }

    const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
    const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0)
    const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
    const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0

    setStats({
      totalRecords: records.length,
      totalCost,
      averagePrice,
      totalQuantity,
      totalDistance,
      averageCostPerKm
    })
  }

  useEffect(() => {
    const initializeDashboard = async () => {
      await checkUser()
      await fetchFuelRecords()
      await fetchUserSettings()
      setLoading(false)
    }

    initializeDashboard()
  }, [checkUser, fetchFuelRecords, fetchUserSettings])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <BurgerMenu />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="spinner-modern mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <BurgerMenu />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {userSettings?.display_name || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Here&apos;s your fuel consumption overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stats-card animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRecords}</p>
                </div>
                <div className="stats-icon gradient-primary">
                  <List className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Cost</p>
                  <p className="text-3xl font-bold text-gradient-success">
                    Rp {stats.totalCost.toLocaleString()}
                  </p>
                </div>
                <div className="stats-icon gradient-success">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Distance</p>
                  <p className="text-3xl font-bold text-gradient-warning">
                    {stats.totalDistance.toFixed(1)} km
                  </p>
                </div>
                <div className="stats-icon gradient-warning">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Cost/km</p>
                  <p className="text-3xl font-bold text-gradient">
                    Rp {stats.averageCostPerKm.toFixed(0)}
                  </p>
                </div>
                <div className="stats-icon gradient-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => router.push('/dashboard/add-record')}
            className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add Record</span>
          </Button>

          <Button
            onClick={() => router.push('/dashboard/records')}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center space-y-2 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <List className="h-8 w-8" />
            <span className="text-sm font-medium">View Records</span>
          </Button>

          <Button
            onClick={() => router.push('/dashboard/statistics')}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center space-y-2 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <BarChart3 className="h-8 w-8" />
            <span className="text-sm font-medium">Statistics</span>
          </Button>

          <Button
            onClick={() => router.push('/dashboard/profile')}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center space-y-2 border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <Calendar className="h-8 w-8" />
            <span className="text-sm font-medium">Profile</span>
          </Button>
        </div>

        {/* Feature Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <BudgetTracker />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <SmartReminders />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <AdvancedStats />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <AchievementSystem />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <ReceiptScanner />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <VehicleManager />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '1.0s' }}>
            <CarbonFootprint />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '1.1s' }}>
            <PDFExport />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <Challenges />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '1.3s' }}>
            <Notifications />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '1.4s' }}>
            <AdvancedAnalytics />
          </div>
        </div>
      </div>
    </div>
  )
} 