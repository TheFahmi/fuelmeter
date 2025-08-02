'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BurgerMenu } from '@/components/ui/menu'
import { Plus, BarChart3, List, User, Fuel, TrendingUp, Calendar, Target } from 'lucide-react'
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
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
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

      setFuelRecords(records || [])
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <BurgerMenu />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BurgerMenu />
      
      <div className="max-w-7xl mx-auto p-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Selamat datang, {userSettings?.display_name || user?.email?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {userSettings?.vehicle_type
              ? `Kelola data bahan bakar ${userSettings.vehicle_type} Anda dengan mudah`
              : 'Kelola data bahan bakar Anda dengan mudah'
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRecords}</p>
                </div>
                <Fuel className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {stats.totalCost.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Distance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalDistance.toFixed(1)} km
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Cost/km</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {stats.averageCostPerKm.toFixed(0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => router.push('/dashboard/add-record')}
            className="h-16 text-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Record
          </Button>
          
          <Button
            onClick={() => router.push('/dashboard/records')}
            variant="outline"
            className="h-16 text-lg"
          >
            <List className="h-5 w-5 mr-2" />
            View All Records
          </Button>
          
          <Button
            onClick={() => router.push('/dashboard/statistics')}
            variant="outline"
            className="h-16 text-lg"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            View Statistics
          </Button>
        </div>

        {/* Smart Reminders */}
        <div className="mb-6">
          <SmartReminders />
        </div>

        {/* Budget Tracker */}
        <div className="mb-6">
          <BudgetTracker />
        </div>

        {/* Advanced Statistics */}
        <div className="mb-6">
          <AdvancedStats />
        </div>

        {/* Achievement System */}
        <div className="mb-6">
          <AchievementSystem />
        </div>

        {/* Vehicle Manager */}
        <div className="mb-6">
          <VehicleManager />
        </div>

        {/* Receipt Scanner */}
        <div className="mb-6">
          <ReceiptScanner />
        </div>

        {/* Carbon Footprint */}
        <div className="mb-6">
          <CarbonFootprint />
        </div>

        {/* PDF Export */}
        <div className="mb-6">
          <PDFExport />
        </div>

        {/* Challenges & Leaderboard */}
        <div className="mb-6">
          <Challenges />
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <Notifications />
        </div>

        {/* Advanced Analytics */}
        <div className="mb-6">
          <AdvancedAnalytics />
        </div>
      </div>
    </div>
  )
} 