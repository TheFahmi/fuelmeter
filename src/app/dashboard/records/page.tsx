'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BurgerMenu } from '@/components/ui/menu'
import { Loading } from '@/components/ui/loading'
import { ThemeWrapper } from '@/components/ui/theme-wrapper'
import { Fuel, ArrowLeft, Plus, Trash2, Edit } from 'lucide-react'
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

export default function RecordsPage() {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh the list
      fetchFuelRecords()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus'
      setError(errorMessage)
    }
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
                  <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <Fuel className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Semua Catatan</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard/add-record">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah
                    </Button>
                  </Link>
                  <BurgerMenu isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
                </div>
              </div>
            </div>
          </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

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
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {record.fuel_type}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {record.quantity}L
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(record.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Rp {record.price_per_liter.toLocaleString()}/L</span>
                        <span>•</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Total: Rp {record.total_cost.toLocaleString()}
                        </span>
                      </div>
                      {record.odometer_km > 0 && (
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>Odo: {record.odometer_km} km</span>
                          {record.distance_km > 0 && (
                            <>
                              <span>•</span>
                              <span>Jarak: {record.distance_km} km</span>
                              <span>•</span>
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                Rp {record.cost_per_km.toFixed(0)}/km
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/dashboard/edit-record/${record.id}`}>
                        <button
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {fuelRecords.length > 0 && (
          <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ringkasan</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Catatan</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{fuelRecords.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Biaya</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {fuelRecords.reduce((sum, record) => sum + record.total_cost, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Liter</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {fuelRecords.reduce((sum, record) => sum + record.quantity, 0).toFixed(1)}L
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jarak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {fuelRecords.reduce((sum, record) => sum + record.distance_km, 0).toFixed(1)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rata-rata Harga</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {(
                      fuelRecords.reduce((sum, record) => sum + record.total_cost, 0) /
                      fuelRecords.reduce((sum, record) => sum + record.quantity, 0)
                    ).toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Biaya per km</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rp {(
                      fuelRecords.reduce((sum, record) => sum + record.total_cost, 0) /
                      fuelRecords.reduce((sum, record) => sum + record.distance_km, 0)
                    ).toFixed(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
      )}
    </ThemeWrapper>
  )
} 