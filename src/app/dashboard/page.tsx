'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, BarChart3, List, TrendingUp, Calendar, Target, ScanLine, Car, Leaf, FileText, Bell } from 'lucide-react'
import { usePremium } from '@/contexts/premium-context'
import { PremiumBadge } from '@/components/premium/premium-badge'

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
  const { isPremium } = usePremium()
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
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-800 dark:text-white/80">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🚗 Dashboard
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-gray-700 dark:text-white/70 text-lg">
                Welcome back, {userSettings?.display_name || user?.email}! ✨
              </p>
              {isPremium && <PremiumBadge size="lg" variant="default" />}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-white/60 text-sm uppercase tracking-wide">Total Records</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalRecords}</p>
              </div>
              <div className="bg-blue-500/20 rounded-full p-3">
                <List className="h-8 w-8 text-blue-300" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-white/60 text-sm uppercase tracking-wide">Total Cost</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rp {stats.totalCost.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-500/20 rounded-full p-3">
                <TrendingUp className="h-8 w-8 text-green-300" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-white/60 text-sm uppercase tracking-wide">Total Distance</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.totalDistance.toFixed(1)} km
                </p>
              </div>
              <div className="bg-purple-500/20 rounded-full p-3">
                <Target className="h-8 w-8 text-purple-300" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-white/60 text-sm uppercase tracking-wide">Avg Cost/km</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rp {stats.averageCostPerKm.toFixed(0)}
                </p>
              </div>
              <div className="bg-orange-500/20 rounded-full p-3">
                <BarChart3 className="h-8 w-8 text-orange-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => router.push('/dashboard/add-record')}
            className="backdrop-blur-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 transform hover:scale-105 text-slate-900 dark:text-white"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="bg-white/20 rounded-full p-3">
                <Plus className="h-8 w-8" />
              </div>
              <span className="font-semibold">➕ Add Record</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/records')}
            className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105 text-slate-900 dark:text-white"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="bg-white/20 rounded-full p-3">
                <List className="h-8 w-8" />
              </div>
              <span className="font-semibold">📋 View Records</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/statistics')}
            className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105 text-slate-900 dark:text-white"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="bg-white/20 rounded-full p-3">
                <BarChart3 className="h-8 w-8" />
              </div>
              <span className="font-semibold">📊 Statistics</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/profile')}
            className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105 text-slate-900 dark:text-white"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="bg-white/20 rounded-full p-3">
                <Calendar className="h-8 w-8" />
              </div>
              <span className="font-semibold">👤 Profile</span>
            </div>
          </button>

          {!isPremium && (
            <button
              onClick={() => router.push('/dashboard/premium')}
              className="backdrop-blur-md bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-400/30 rounded-2xl p-6 shadow-2xl hover:from-yellow-500/20 hover:to-yellow-600/20 transition-all duration-300 transform hover:scale-105 text-slate-900 dark:text-white"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-yellow-500/30 rounded-full p-3">
                  <Target className="h-8 w-8 text-yellow-300" />
                </div>
                <span className="font-semibold">👑 Upgrade Premium</span>
                <span className="text-xs text-yellow-200">Unlock all features</span>
              </div>
            </button>
          )}
        </div>

        {/* Feature Entrypoints (link to dedicated pages) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button onClick={() => router.push('/dashboard/ai-scanner')} className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 text-slate-900 dark:text-white flex items-center gap-3">
            <ScanLine className="h-6 w-6" /> AI Receipt Scanner
          </button>
          <button onClick={() => router.push('/dashboard/vehicles')} className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 text-slate-900 dark:text-white flex items-center gap-3">
            <Car className="h-6 w-6" /> Vehicles
          </button>
          <button onClick={() => router.push('/dashboard/carbon')} className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 text-slate-900 dark:text-white flex items-center gap-3">
            <Leaf className="h-6 w-6" /> Carbon Footprint
          </button>
          <button onClick={() => router.push('/dashboard/export')} className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="h-6 w-6" /> Export / Reports
          </button>
          <button onClick={() => router.push('/dashboard/reminders')} className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 text-slate-900 dark:text-white flex items-center gap-3">
            <Calendar className="h-6 w-6" /> Service Reminders
          </button>
          <button onClick={() => router.push('/dashboard/notifications')} className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 text-slate-900 dark:text-white flex items-center gap-3">
            <Bell className="h-6 w-6" /> Notifications
          </button>
        </div>
      </div>
    </div>
  )
} 