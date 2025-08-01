'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BurgerMenu } from '@/components/ui/menu'
import { Loading } from '@/components/ui/loading'
import { InitialOdometerModal } from '@/components/initial-odometer-modal'
import { useTheme } from '@/contexts/theme-context'
import { Fuel, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function AddRecordPage() {
  const [date, setDate] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [odometerKm, setOdometerKm] = useState('')
  const [lastOdometer, setLastOdometer] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showInitialOdometerModal, setShowInitialOdometerModal] = useState(false)
  const [hasRecords, setHasRecords] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  // Only use theme after component is mounted
  const themeContext = useTheme()
  const isDarkMode = mounted ? themeContext.isDarkMode : false
  const toggleDarkMode = mounted ? themeContext.toggleDarkMode : () => {}

  useEffect(() => {
    setMounted(true)
    // Set default date to today
    const today = new Date().toISOString().split('T')[0]
    setDate(today)
    checkUser()
    checkUserRecords()
  }, [])

  const checkUserRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('id')
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setHasRecords(true)
        fetchLastOdometer()
      } else {
        setHasRecords(false)
        setShowInitialOdometerModal(true)
      }
    } catch (error) {
      console.error('Error checking user records:', error)
      setShowInitialOdometerModal(true)
    }
  }

  const fetchLastOdometer = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('odometer_km')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setLastOdometer(data[0].odometer_km)
      }
    } catch (error) {
      console.error('Error fetching last odometer:', error)
    }
  }

  const saveInitialOdometer = async (initialOdometer: number) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          initial_odometer: initialOdometer
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setLastOdometer(initialOdometer)
      setShowInitialOdometerModal(false)
    } catch (error) {
      console.error('Error saving initial odometer:', error)
      setError('Gagal menyimpan odometer awal')
    }
  }

  const skipInitialOdometer = () => {
    setShowInitialOdometerModal(false)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(pricePerLiter) || 0
    return (qty * price).toFixed(0)
  }

  const calculateDistance = () => {
    const currentOdometer = parseFloat(odometerKm) || 0
    const lastOdo = lastOdometer || 0
    
    // Jika ini catatan pertama dan ada odometer awal, gunakan odometer awal
    if (!hasRecords && lastOdo > 0) {
      return Math.max(0, currentOdometer - lastOdo)
    }
    
    // Jika ada catatan sebelumnya, gunakan odometer terakhir
    if (hasRecords && lastOdo > 0) {
      return Math.max(0, currentOdometer - lastOdo)
    }
    
    return 0
  }

  const calculateCostPerKm = () => {
    const total = parseFloat(calculateTotal()) || 0
    const distance = calculateDistance()
    return distance > 0 ? (total / distance).toFixed(0) : '0'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!date || !fuelType || !quantity || !pricePerLiter) {
      setError('Semua field harus diisi')
      setLoading(false)
      return
    }

    const totalCost = parseFloat(calculateTotal())
    const currentOdometer = parseFloat(odometerKm) || 0
    const distance = calculateDistance()
    const costPerKm = distance > 0 ? totalCost / distance : 0

    try {
      const { error } = await supabase
        .from('fuel_records')
        .insert([
          {
            date,
            fuel_type: fuelType,
            quantity: parseFloat(quantity),
            price_per_liter: parseFloat(pricePerLiter),
            total_cost: totalCost,
            odometer_km: currentOdometer,
            distance_km: distance,
            cost_per_km: costPerKm,
          }
        ])

      if (error) throw error

      setSuccess('Catatan berhasil ditambahkan!')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Initial Odometer Modal */}
      <InitialOdometerModal
        isOpen={showInitialOdometerModal}
        onSave={saveInitialOdometer}
        onSkip={skipInitialOdometer}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Tambah Catatan</h1>
            </div>
            <div className="flex items-center space-x-4">
              <BurgerMenu isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Tambah Catatan Bahan Bakar</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Isi informasi pengisian bahan bakar Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Tanggal"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <Select
                label="Jenis Bahan Bakar"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                options={[
                  { value: '', label: 'Pilih jenis bahan bakar' },
                  { value: 'Pertalite', label: 'Pertalite' },
                  { value: 'Pertamax', label: 'Pertamax' },
                  { value: 'Pertamax Turbo', label: 'Pertamax Turbo' },
                  { value: 'Solar', label: 'Solar' },
                  { value: 'Pertamina Dex', label: 'Pertamina Dex' },
                  { value: 'Lainnya', label: 'Lainnya' }
                ]}
                required
              />

              <Input
                label="Jumlah (Liter)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />

              <Input
                label="Harga per Liter (Rp)"
                type="number"
                min="0"
                placeholder="0"
                value={pricePerLiter}
                onChange={(e) => setPricePerLiter(e.target.value)}
                required
              />

              <Input
                label="Odometer (km)"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
              />

              {/* Total Calculation */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Biaya:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Rp {calculateTotal()}
                  </span>
                </div>
                {lastOdometer !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jarak Tempuh:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {calculateDistance().toFixed(1)} km
                    </span>
                  </div>
                )}
                {!hasRecords && lastOdometer && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Berdasarkan odometer awal: {lastOdometer} km
                  </div>
                )}
                {calculateDistance() > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Biaya per km:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      Rp {calculateCostPerKm()}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  {success}
                </div>
              )}

              <div className="flex space-x-4">
                <Link href="/dashboard" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                  >
                    Batal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 