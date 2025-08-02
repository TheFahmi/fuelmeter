'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BurgerMenu } from '@/components/ui/menu'
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
import { Plus, BarChart3, Edit, Fuel, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface UserSettings {
  display_name?: string
  vehicle_type?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalCost: 0,
    averagePrice: 0,
    totalQuantity: 0,
    totalDistance: 0,
    averageCostPerKm: 0
  })
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
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
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: false })

      if (records) {
        calculateStats(records)
      }
    } catch (error) {
      console.error('Error fetching fuel records:', error)
    }
  }, [supabase])

  const fetchUserSettings = useCallback(async () => {
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('display_name, vehicle_type')
        .single()

      setUserSettings(settings)
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }, [supabase])

  useEffect(() => {
    checkUser()
    fetchFuelRecords()
    fetchUserSettings()
    setLoading(false)
  }, [checkUser, fetchFuelRecords, fetchUserSettings])

  const calculateStats = (records: any[]) => {
    const totalRecords = records.length
    const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
    const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0)
    const totalDistance = records.reduce((sum, record) => sum + (record.distance_km || 0), 0)
    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
    const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0

    setStats({
      totalRecords,
      totalCost,
      averagePrice,
      totalQuantity,
      totalDistance,
      averageCostPerKm
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">FuelMeter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <BurgerMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Fuel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rp {stats.totalCost.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Distance</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.totalDistance.toFixed(0)} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <BarChart3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Cost/km</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rp {stats.averageCostPerKm.toFixed(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/dashboard/add-record">
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </Link>
          <Link href="/dashboard/records">
            <Button variant="outline" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              View All Records
            </Button>
          </Link>
          <Link href="/dashboard/statistics">
            <Button variant="outline" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Statistics
            </Button>
          </Link>
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
      </main>
    </div>
  )
} 