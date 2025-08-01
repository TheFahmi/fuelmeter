'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BurgerMenu } from '@/components/ui/menu'
import { ThemeWrapper } from '@/components/ui/theme-wrapper'
import { 
  Fuel, 
  TrendingDown, 
  BarChart3, 
  DollarSign,
  MapPin,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface FuelRecord {
  id: string
  date: string
  fuel_type: string
  quantity: number
  price_per_liter: number
  total_cost: number
  odometer_km: number
  distance_km: number
  cost_per_km: number
  created_at: string
}

interface MonthlyStats {
  month: string
  totalCost: number
  totalQuantity: number
  totalDistance: number
  averageCostPerKm: number
  recordCount: number
}

export default function StatisticsPage() {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchFuelRecords()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  const fetchFuelRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setFuelRecords(data)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRecords = () => {
    if (selectedPeriod === 'all') return fuelRecords

    const now = new Date()
    const filterDate = new Date()

    switch (selectedPeriod) {
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        filterDate.setMonth(now.getMonth() - 3)
        break
      case '6months':
        filterDate.setMonth(now.getMonth() - 6)
        break
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        return fuelRecords
    }

    return fuelRecords.filter(record => new Date(record.date) >= filterDate)
  }

  const getMonthlyStats = (): MonthlyStats[] => {
    const monthlyData: { [key: string]: MonthlyStats } = {}

    fuelRecords.forEach(record => {
      const date = new Date(record.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          totalCost: 0,
          totalQuantity: 0,
          totalDistance: 0,
          averageCostPerKm: 0,
          recordCount: 0
        }
      }

      monthlyData[monthKey].totalCost += record.total_cost
      monthlyData[monthKey].totalQuantity += record.quantity
      monthlyData[monthKey].totalDistance += record.distance_km
      monthlyData[monthKey].recordCount += 1
    })

    // Calculate average cost per km for each month
    Object.values(monthlyData).forEach(month => {
      month.averageCostPerKm = month.totalDistance > 0 ? month.totalCost / month.totalDistance : 0
    })

    return Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.month)
      const dateB = new Date(b.month)
      return dateB.getTime() - dateA.getTime()
    })
  }

  const getFuelTypeStats = () => {
    const stats: { [key: string]: { totalCost: number; totalQuantity: number; count: number } } = {}

    fuelRecords.forEach(record => {
      if (!stats[record.fuel_type]) {
        stats[record.fuel_type] = { totalCost: 0, totalQuantity: 0, count: 0 }
      }
      stats[record.fuel_type].totalCost += record.total_cost
      stats[record.fuel_type].totalQuantity += record.quantity
      stats[record.fuel_type].count += 1
    })

    return Object.entries(stats).map(([type, data]) => ({
      type,
      ...data,
      averagePrice: data.totalQuantity > 0 ? data.totalCost / data.totalQuantity : 0
    }))
  }

  const filteredRecords = getFilteredRecords()
  const monthlyStats = getMonthlyStats()
  const fuelTypeStats = getFuelTypeStats()

  const totalStats = {
    totalCost: filteredRecords.reduce((sum, record) => sum + record.total_cost, 0),
    totalQuantity: filteredRecords.reduce((sum, record) => sum + record.quantity, 0),
    totalDistance: filteredRecords.reduce((sum, record) => sum + record.distance_km, 0),
    averageCostPerKm: filteredRecords.reduce((sum, record) => sum + record.total_cost, 0) / 
                     Math.max(filteredRecords.reduce((sum, record) => sum + record.distance_km, 0), 1),
    recordCount: filteredRecords.length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat statistik...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeWrapper>
      {({ isDarkMode, toggleDarkMode }) => (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Statistik</h1>
                </div>
                <BurgerMenu isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
              </div>
            </div>
          </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Period Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'month', label: '1 Bulan' },
              { key: '3months', label: '3 Bulan' },
              { key: '6months', label: '6 Bulan' },
              { key: 'year', label: '1 Tahun' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Catatan</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.recordCount}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Biaya</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {totalStats.totalCost.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Liter</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalStats.totalQuantity.toFixed(1)}L
                  </p>
                </div>
                <Fuel className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jarak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalStats.totalDistance.toFixed(1)} km
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Biaya per km</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {totalStats.averageCostPerKm.toFixed(0)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Statistik Bulanan</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Perkembangan penggunaan bahan bakar per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyStats.slice(0, 6).map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{month.month}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {month.recordCount} catatan
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Rp {month.totalCost.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {month.totalQuantity.toFixed(1)}L
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fuel Type Statistics */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Statistik Jenis Bahan Bakar</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Penggunaan berdasarkan jenis bahan bakar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fuelTypeStats.map((fuel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{fuel.type}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fuel.count} kali pengisian
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Rp {fuel.totalCost.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fuel.totalQuantity.toFixed(1)}L
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Efficiency Analysis */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Analisis Efisiensi</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Perbandingan efisiensi penggunaan bahan bakar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Rata-rata Konsumsi</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {(totalStats.totalQuantity / Math.max(totalStats.totalDistance, 1) * 100).toFixed(1)} L/100km
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Efisiensi Biaya</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  Rp {totalStats.averageCostPerKm.toFixed(0)}/km
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Jarak</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {totalStats.totalDistance.toFixed(0)} km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
      )}
    </ThemeWrapper>
  )
} 