'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BurgerMenu } from '@/components/ui/menu'
import { Loading } from '@/components/ui/loading'
import { ThemeWrapper } from '@/components/ui/theme-wrapper'
import { BudgetTracker } from '@/components/budget-tracker'
import { Fuel, Plus, TrendingUp, TrendingDown, BarChart3, Edit } from 'lucide-react'
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

interface UserSettings {
  display_name?: string
  vehicle_type?: string
  fuel_capacity?: number
  monthly_budget?: number
  currency?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalCost: 0,
    averagePrice: 0,
    totalQuantity: 0,
    totalDistance: 0,
    averageCostPerKm: 0
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchFuelRecords()
    fetchUserSettings()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
    }
  }

  const fetchUserSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('display_name, vehicle_type, fuel_capacity, monthly_budget, currency')
        .single()

      if (!error && settings) {
        setUserSettings(settings)
      }
    } catch (error) {
      console.log('User settings not found or error:', error)
    }
  }

  const fetchFuelRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      if (data) {
        setFuelRecords(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error('Error fetching fuel records:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (records: FuelRecord[]) => {
    const totalRecords = records.length
    const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
    const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0)
    const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
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
    return <Loading />
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <Fuel className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">FuelMeter</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <BurgerMenu isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
                </div>
              </div>
            </div>
          </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Catatan</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRecords}</p>
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
                    Rp {stats.totalCost.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Liter</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalQuantity.toFixed(1)}L
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
                    {stats.totalDistance.toFixed(1)} km
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rata-rata Harga</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {stats.averagePrice.toFixed(0)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Biaya per km</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {stats.averageCostPerKm.toFixed(0)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Tracker */}
        <div className="mb-6">
          <BudgetTracker />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aksi Cepat</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/add-record">
              <Card className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Tambah Catatan</h4>
                      <p className="text-gray-600 dark:text-gray-400">Catat pengisian bahan bakar baru</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/records">
              <Card className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                      <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Lihat Semua</h4>
                      <p className="text-gray-600 dark:text-gray-400">Lihat semua catatan bahan bakar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Records */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Catatan Terbaru</h3>
            <Link
              href="/dashboard/records"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Lihat semua
            </Link>
          </div>
          
          {fuelRecords.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <Fuel className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum ada catatan</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Mulai dengan menambahkan catatan pengisian bahan bakar pertama Anda
                </p>
                <Link href="/dashboard/add-record">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Catatan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
                         <div className="space-y-4">
               {fuelRecords.map((record) => (
                 <Card key={record.id} className="dark:bg-gray-800 dark:border-gray-700">
                   <CardContent className="p-4">
                     <div className="flex items-center justify-between">
                       <div className="flex-1">
                         <h4 className="font-medium text-gray-900 dark:text-white">
                           {record.fuel_type}
                         </h4>
                         <p className="text-sm text-gray-600 dark:text-gray-400">
                           {new Date(record.date).toLocaleDateString('id-ID')}
                         </p>
                       </div>
                       <div className="text-right">
                         <p className="font-medium text-gray-900 dark:text-white">
                           {record.quantity}L
                         </p>
                         <p className="text-sm text-gray-600 dark:text-gray-400">
                           Rp {record.total_cost.toLocaleString()}
                         </p>
                       </div>
                       <div className="flex items-center space-x-2 ml-4">
                         <Link href={`/dashboard/edit-record/${record.id}`}>
                           <button
                             className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                             title="Edit"
                           >
                             <Edit className="h-4 w-4" />
                           </button>
                         </Link>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
          )}
        </div>
      </main>
    </div>
      )}
    </ThemeWrapper>
  )
} 