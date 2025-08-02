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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <BurgerMenu />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = calculateStats()
  const monthlyData = getMonthlyData()
  const trend = getRecentTrend()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BurgerMenu />
      
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed analysis of your fuel consumption patterns
          </p>
        </div>

        {/* Overview Stats */}
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
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Average Price per Liter</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rp {stats.averagePrice.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Fuel Efficiency</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.averageEfficiency.toFixed(1)} km/L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Fuel Used</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.totalQuantity.toFixed(1)} L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Most Used Fuel Type</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.mostUsedFuelType || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Most Used Station</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.mostUsedStation || 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Recent Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                {trend === 'increasing' ? (
                  <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400" />
                ) : trend === 'decreasing' ? (
                  <TrendingDown className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {trend === 'increasing' ? 'Costs Increasing' :
                     trend === 'decreasing' ? 'Costs Decreasing' :
                     trend === 'stable' ? 'Costs Stable' : 'Insufficient Data'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on last 3 records vs previous 3
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        {monthlyData.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Month</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Records</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Quantity</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Distance</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Avg Cost/km</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((month) => (
                      <tr key={month.month} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-2 text-sm text-gray-900 dark:text-white">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </td>
                        <td className="py-2 text-sm text-right text-gray-900 dark:text-white">
                          {month.recordCount}
                        </td>
                        <td className="py-2 text-sm text-right text-gray-900 dark:text-white">
                          Rp {month.totalCost.toLocaleString()}
                        </td>
                        <td className="py-2 text-sm text-right text-gray-900 dark:text-white">
                          {month.totalQuantity.toFixed(1)} L
                        </td>
                        <td className="py-2 text-sm text-right text-gray-900 dark:text-white">
                          {month.totalDistance.toFixed(1)} km
                        </td>
                        <td className="py-2 text-sm text-right text-gray-900 dark:text-white">
                          Rp {month.totalDistance > 0 ? (month.totalCost / month.totalDistance).toFixed(0) : '0'}
                        </td>
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