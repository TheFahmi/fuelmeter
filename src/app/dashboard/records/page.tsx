'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BurgerMenu } from '@/components/ui/menu'
import { Calendar, MapPin, Trash2, Edit } from 'lucide-react'

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

export default function RecordsPage() {
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
        .order('date', { ascending: false })

      if (error) throw error

      setFuelRecords(records || [])
    } catch (error) {
      console.error('Error fetching fuel records:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const initializeRecords = async () => {
      await checkUser()
      await fetchFuelRecords()
    }

    initializeRecords()
  }, [checkUser, fetchFuelRecords])

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      setFuelRecords(prev => prev.filter(record => record.id !== recordId))
      alert('Record deleted successfully!')
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete record. Please try again.')
    }
  }

  const calculateCostPerKm = (totalCost: number, distance: number) => {
    return distance > 0 ? totalCost / distance : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <BurgerMenu />
        <div className="flex items-center justify-center min-h-screen">
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-800 dark:text-white/80">Loading records...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28 sm:pb-6">
      <BurgerMenu />

      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ⛽ Fuel Records
            </h1>
            <p className="text-gray-700 dark:text-white/70">
              View and manage all your fuel purchase records with beautiful glassmorphism design
            </p>
          </div>
        </div>

        {/* Records List */}
        {fuelRecords.length === 0 ? (
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl">
            <div className="p-8 text-center">
              <div className="text-gray-600 dark:text-white/60 mb-6">
                <Calendar className="h-20 w-20 mx-auto" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                No Records Found
              </h3>
              <p className="text-gray-700 dark:text-white/70 mb-6 text-lg">
                You haven&apos;t added any fuel records yet. Start tracking your fuel consumption!
              </p>
              <Button
                onClick={() => router.push('/dashboard/add-record')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                ✨ Add Your First Record
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fuelRecords.map((record) => (
              <div
                key={record.id}
                className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-3xl"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                        ⛽ {record.fuel_type}
                      </h3>
                      <p className="text-slate-600 dark:text-white/60 text-sm">
                        📅 {new Date(record.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => router.push(`/dashboard/edit-record/${record.id}`)}
                        size="sm"
                        className="backdrop-blur-sm bg-black/10 dark:bg-white/20 hover:bg-black/15 dark:hover:bg-white/30 text-slate-900 dark:text-white border border-black/20 dark:border-white/30 rounded-xl transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(record.id)}
                        size="sm"
                        className="backdrop-blur-sm bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-400/30 rounded-xl transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl p-3 border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                        <span className="text-slate-600 dark:text-white/60 text-xs uppercase tracking-wide">Quantity</span>
                        <div className="text-slate-900 dark:text-white font-semibold text-lg">
                          {record.quantity} L
                        </div>
                      </div>

                      <div className="rounded-xl p-3 border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                        <span className="text-slate-600 dark:text-white/60 text-xs uppercase tracking-wide">Price/L</span>
                        <div className="text-slate-900 dark:text-white font-semibold text-lg">
                          Rp {record.price_per_liter.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-xl p-4 border border-black/10 dark:border-white/20">
                      <span className="text-slate-700 dark:text-white/70 text-sm">💰 Total Cost</span>
                      <div className="text-slate-900 dark:text-white font-bold text-2xl">
                        Rp {record.total_cost.toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl p-3 border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                        <span className="text-slate-600 dark:text-white/60 text-xs uppercase tracking-wide">Distance</span>
                        <div className="text-slate-900 dark:text-white font-semibold">
                          🛣️ {record.distance_km} km
                        </div>
                      </div>

                      <div className="rounded-xl p-3 border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                        <span className="text-slate-600 dark:text-white/60 text-xs uppercase tracking-wide">Cost/km</span>
                        <div className="text-slate-900 dark:text-white font-semibold">
                          Rp {calculateCostPerKm(record.total_cost, record.distance_km).toFixed(0)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-3 border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                      <span className="text-slate-600 dark:text-white/60 text-xs uppercase tracking-wide">Odometer</span>
                      <div className="text-slate-900 dark:text-white font-semibold">
                        🚗 {record.odometer_km.toLocaleString()} km
                      </div>
                    </div>

                    {record.station && (
                      <div className="rounded-xl p-3 border bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                        <div className="flex items-center space-x-2 text-slate-800 dark:text-white/80">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">📍 {record.station}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <Button
          onClick={() => router.push('/dashboard/add-record')}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 backdrop-blur-md border border-white/20"
          size="lg"
        >
          <Calendar className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}