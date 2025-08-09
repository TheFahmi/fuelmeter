'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BurgerMenu } from '@/components/ui/menu'
import { BarChart3, TrendingUp, TrendingDown, Fuel, DollarSign, Target } from 'lucide-react'

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

interface MonthlyData {
  month: string
  totalCost: number
  totalQuantity: number
  totalDistance: number
  recordCount: number
}

export default function StatisticsPage() {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }, [supabase, router])

  const fetchFuelRecords = useCallback(async () => {
    try {
      const { data: records, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error

      setFuelRecords(records || [])
    } catch (error) {
      console.error('Error fetching fuel records:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const initializeStatistics = async () => {
      await checkUser()
      await fetchFuelRecords()
    }

    initializeStatistics()
  }, [checkUser, fetchFuelRecords])

  const calculateStats = () => {
    if (fuelRecords.length === 0) {
      return {
        totalRecords: 0,
        totalCost: 0,
        totalQuantity: 0,
        totalDistance: 0,
        averagePrice: 0,
        averageCostPerKm: 0,
        averageEfficiency: 0,
        mostUsedFuelType: '',
        mostUsedStation: ''
      }
    }

    const totalCost = fuelRecords.reduce((sum, record) => sum + record.total_cost, 0)
    const totalQuantity = fuelRecords.reduce((sum, record) => sum + record.quantity, 0)
    const totalDistance = fuelRecords.reduce((sum, record) => sum + record.distance_km, 0)
    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
    const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
    const averageEfficiency = totalQuantity > 0 ? totalDistance / totalQuantity : 0

    // Most used fuel type
    const fuelTypeCount: { [key: string]: number } = {}
    fuelRecords.forEach(record => {
      fuelTypeCount[record.fuel_type] = (fuelTypeCount[record.fuel_type] || 0) + 1
    })
    const mostUsedFuelType = Object.keys(fuelTypeCount).reduce((a, b) => 
      fuelTypeCount[a] > fuelTypeCount[b] ? a : b, '')

    // Most used station
    const stationCount: { [key: string]: number } = {}
    fuelRecords.forEach(record => {
      if (record.station) {
        stationCount[record.station] = (stationCount[record.station] || 0) + 1
      }
    })
    const mostUsedStation = Object.keys(stationCount).reduce((a, b) => 
      stationCount[a] > stationCount[b] ? a : b, '')

    return {
      totalRecords: fuelRecords.length,
      totalCost,
      totalQuantity,
      totalDistance,
      averagePrice,
      averageCostPerKm,
      averageEfficiency,
      mostUsedFuelType,
      mostUsedStation
    }
  }

  const getMonthlyData = (): MonthlyData[] => {
    const monthlyData: { [key: string]: MonthlyData } = {}

    fuelRecords.forEach(record => {
      const month = new Date(record.date).toISOString().slice(0, 7) // YYYY-MM format
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          totalCost: 0,
          totalQuantity: 0,
          totalDistance: 0,
          recordCount: 0
        }
      }

      monthlyData[month].totalCost += record.total_cost
      monthlyData[month].totalQuantity += record.quantity
      monthlyData[month].totalDistance += record.distance_km
      monthlyData[month].recordCount += 1
    })

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
  }

  const getRecentTrend = () => {
    if (fuelRecords.length < 2) return 'insufficient_data'

    const sortedRecords = [...fuelRecords].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const recentRecords = sortedRecords.slice(-3)
    const olderRecords = sortedRecords.slice(-6, -3)

    if (olderRecords.length === 0) return 'insufficient_data'

    const recentAvgCost = recentRecords.reduce((sum, r) => sum + r.total_cost, 0) / recentRecords.length
    const olderAvgCost = olderRecords.reduce((sum, r) => sum + r.total_cost, 0) / olderRecords.length

    if (recentAvgCost > olderAvgCost * 1.1) return 'increasing'
    if (recentAvgCost < olderAvgCost * 0.9) return 'decreasing'
    return 'stable'
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <BurgerMenu />
        <div className="flex items-center justify-center min-h-screen">
          <div className="backdrop-blur-md bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-800 dark:text-white/80">Loading statistics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = calculateStats()
  const monthlyData = getMonthlyData()
  const trend = getRecentTrend()

  return (
    <div className="statistics-page min-h-screen pb-28 sm:pb-6">
      <BurgerMenu />

      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-md bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Statistics
            </h1>
            <p className="text-gray-700 dark:text-white/70 text-lg">
              Detailed analysis of your fuel consumption patterns
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-md bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-white/60 text-sm uppercase tracking-wide">Total Records</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalRecords}</p>
              </div>
              <div className="bg-blue-500/20 rounded-full p-3">
                <Fuel className="h-8 w-8 text-blue-700 dark:text-blue-300" style={{ color: '#1d4ed8' }} />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-white/60 text-sm uppercase tracking-wide">Total Cost</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rp {stats.totalCost.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-500/20 rounded-full p-3">
                <DollarSign className="h-8 w-8 text-green-700 dark:text-green-300" style={{ color: '#15803d' }} />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-white/60 text-sm uppercase tracking-wide">Total Distance</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.totalDistance.toFixed(1)} km
                </p>
              </div>
              <div className="bg-purple-500/20 rounded-full p-3">
                <Target className="h-8 w-8 text-purple-700 dark:text-purple-300" style={{ color: '#7e22ce' }} />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-white/60 text-sm uppercase tracking-wide">Avg Cost/km</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rp {stats.averageCostPerKm.toFixed(0)}
                </p>
              </div>
              <div className="bg-orange-500/20 rounded-full p-3">
                <BarChart3 className="h-8 w-8 text-orange-700 dark:text-orange-300" style={{ color: '#c2410c' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800 border border-black/10 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-gray-400 flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-700 dark:text-green-400" /> Average Price per Liter</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  Rp {stats.averagePrice.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-gray-400 flex items-center gap-2"><TrendingDown className="h-4 w-4 text-purple-700 dark:text-purple-400" /> Fuel Efficiency</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {stats.averageEfficiency.toFixed(1)} km/L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-gray-400 flex items-center gap-2"><Fuel className="h-4 w-4 text-blue-700 dark:text-blue-400" /> Total Fuel Used</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {stats.totalQuantity.toFixed(1)} L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-gray-400 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-orange-700 dark:text-orange-400" /> Most Used Fuel Type</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {stats.mostUsedFuelType || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-gray-400 flex items-center gap-2"><Target className="h-4 w-4 text-red-700 dark:text-red-400" /> Most Used Station</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {stats.mostUsedStation || 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800 border border-black/10 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Recent Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                {trend === 'increasing' ? (
                  <TrendingUp className="h-8 w-8 text-red-700 dark:text-red-400" />
                ) : trend === 'decreasing' ? (
                  <TrendingDown className="h-8 w-8 text-green-700 dark:text-green-400" />
                ) : (
                  <BarChart3 className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                )}
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {trend === 'increasing' ? 'Costs Increasing' :
                     trend === 'decreasing' ? 'Costs Decreasing' :
                     trend === 'stable' ? 'Costs Stable' : 'Insufficient Data'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    Based on last 3 records vs previous 3
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        {monthlyData.length > 0 && (
          <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800 border border-black/10 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {monthlyData.map((m) => (
                  <div
                    key={m.month}
                    className="rounded-xl border border-black/10 dark:border-gray-700 bg-white p-4 shadow-md dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-gray-400">{m.recordCount} records</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600 dark:text-gray-400">Total Cost</div>
                      <div className="text-right text-slate-900 dark:text-white">Rp {m.totalCost.toLocaleString()}</div>
                      <div className="text-slate-600 dark:text-gray-400">Quantity</div>
                      <div className="text-right text-slate-900 dark:text-white">{m.totalQuantity.toFixed(1)} L</div>
                      <div className="text-slate-600 dark:text-gray-400">Distance</div>
                      <div className="text-right text-slate-900 dark:text-white">{m.totalDistance.toFixed(1)} km</div>
                      <div className="text-slate-600 dark:text-gray-400">Avg Cost/km</div>
                      <div className="text-right text-slate-900 dark:text-white">Rp {m.totalDistance > 0 ? (m.totalCost / m.totalDistance).toFixed(0) : '0'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-black/10 dark:border-gray-700">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2 text-sm font-medium text-slate-600 dark:text-gray-400">Month</th>
                      <th className="text-right py-2 text-sm font-medium text-slate-600 dark:text-gray-400">Records</th>
                      <th className="text-right py-2 text-sm font-medium text-slate-600 dark:text-gray-400">Total Cost</th>
                      <th className="text-right py-2 text-sm font-medium text-slate-600 dark:text-gray-400">Quantity</th>
                      <th className="text-right py-2 text-sm font-medium text-slate-600 dark:text-gray-400">Distance</th>
                      <th className="text-right py-2 text-sm font-medium text-slate-600 dark:text-gray-400">Avg Cost/km</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((month, idx) => (
                      <tr key={month.month} className={`${idx % 2 === 0 ? 'bg-white/70 dark:bg-transparent' : 'bg-slate-50/70 dark:bg-gray-800/40'} border-b border-gray-100 dark:border-gray-700`}>
                        <td className="py-2 text-sm text-slate-900 dark:text-white">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </td>
                        <td className="py-2 text-sm text-right text-slate-900 dark:text-white">{month.recordCount}</td>
                        <td className="py-2 text-sm text-right text-slate-900 dark:text-white">Rp {month.totalCost.toLocaleString()}</td>
                        <td className="py-2 text-sm text-right text-slate-900 dark:text-white">{month.totalQuantity.toFixed(1)} L</td>
                        <td className="py-2 text-sm text-right text-slate-900 dark:text-white">{month.totalDistance.toFixed(1)} km</td>
                        <td className="py-2 text-sm text-right text-slate-900 dark:text-white">Rp {month.totalDistance > 0 ? (month.totalCost / month.totalDistance).toFixed(0) : '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 