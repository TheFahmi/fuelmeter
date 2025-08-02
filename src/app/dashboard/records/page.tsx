'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <BurgerMenu />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading records...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BurgerMenu />
      
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fuel Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your fuel purchase records
          </p>
        </div>

        {/* Records List */}
        {fuelRecords.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Calendar className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Records Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven&apos;t added any fuel records yet.
              </p>
              <Button onClick={() => router.push('/dashboard/add-record')}>
                Add Your First Record
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fuelRecords.map((record) => (
              <Card key={record.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {record.fuel_type}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => router.push(`/dashboard/edit-record/${record.id}`)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(record.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {record.quantity} L
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Price per L:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Rp {record.price_per_liter.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Rp {record.total_cost.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {record.distance_km} km
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cost per km:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Rp {calculateCostPerKm(record.total_cost, record.distance_km).toFixed(0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Odometer:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {record.odometer_km.toLocaleString()} km
                      </span>
                    </div>
                    
                    {record.station && (
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{record.station}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 