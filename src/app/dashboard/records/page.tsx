'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BurgerMenu } from '@/components/ui/menu'
import { Plus, Edit, Trash2, Fuel, Calendar, DollarSign, MapPin } from 'lucide-react'

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

      // Refresh the records list
      fetchFuelRecords()
      alert('Record deleted successfully!')
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete record. Please try again.')
    }
  }

  const calculateCostPerKm = (totalCost: number, distance: number) => {
    if (distance <= 0) return 0
    return totalCost / distance
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Fuel Records
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all your fuel consumption records
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/add-record')}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </div>

        {/* Records List */}
        {fuelRecords.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <Fuel className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Records Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't added any fuel records yet. Start tracking your fuel consumption!
              </p>
              <Button
                onClick={() => router.push('/dashboard/add-record')}
                className="flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Record
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fuelRecords.map((record) => (
              <Card key={record.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Fuel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {record.fuel_type}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => router.push(`/dashboard/edit-record/${record.id}`)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(record.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.quantity} L
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Price/L</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Rp {record.price_per_liter.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Total Cost</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Rp {record.total_cost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Distance</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.distance_km} km
                      </p>
                    </div>
                  </div>

                  {record.distance_km > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cost per km:
                      </p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Rp {calculateCostPerKm(record.total_cost, record.distance_km).toFixed(0)}
                      </p>
                    </div>
                  )}

                  {record.station && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {record.station}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 