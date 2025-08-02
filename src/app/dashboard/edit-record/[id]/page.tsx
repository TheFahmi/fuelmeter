'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BurgerMenu } from '@/components/ui/menu'
import { ArrowLeft, Save, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function EditRecordPage() {
  const [formData, setFormData] = useState({
    date: '',
    fuel_type: '',
    quantity: '',
    price_per_liter: '',
    total_cost: '',
    distance_km: '',
    odometer_km: '',
    station: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [record, setRecord] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const recordId = params.id as string
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }, [supabase, router])

  const fetchRecord = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .eq('id', recordId)
        .single()

      if (error) throw error

      setRecord(data)
      setFormData({
        date: data.date,
        fuel_type: data.fuel_type,
        quantity: data.quantity.toString(),
        price_per_liter: data.price_per_liter.toString(),
        total_cost: data.total_cost.toString(),
        distance_km: data.distance_km?.toString() || '',
        odometer_km: data.odometer_km?.toString() || '',
        station: data.station || ''
      })
    } catch (error) {
      console.error('Error fetching record:', error)
      alert('Record not found')
      router.push('/dashboard/records')
    } finally {
      setLoading(false)
    }
  }, [supabase, recordId, router])

  useEffect(() => {
    checkUser()
    fetchRecord()
  }, [checkUser, fetchRecord])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-calculate total cost
    if (field === 'quantity' || field === 'price_per_liter') {
      const quantity = field === 'quantity' ? parseFloat(value) : parseFloat(formData.quantity)
      const price = field === 'price_per_liter' ? parseFloat(value) : parseFloat(formData.price_per_liter)
      
      if (!isNaN(quantity) && !isNaN(price)) {
        setFormData(prev => ({ ...prev, total_cost: (quantity * price).toString() }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('fuel_records')
        .update({
          date: formData.date,
          fuel_type: formData.fuel_type,
          quantity: parseFloat(formData.quantity),
          price_per_liter: parseFloat(formData.price_per_liter),
          total_cost: parseFloat(formData.total_cost),
          distance_km: parseFloat(formData.distance_km) || 0,
          odometer_km: parseFloat(formData.odometer_km) || null,
          station: formData.station || null
        })
        .eq('id', recordId)

      if (error) throw error

      alert('Record updated successfully!')
      router.push('/dashboard/records')
    } catch (error) {
      console.error('Error updating record:', error)
      alert('Failed to update record. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      alert('Record deleted successfully!')
      router.push('/dashboard/records')
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete record. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard/records" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Record</h1>
            </div>
            <div className="flex items-center space-x-4">
              <BurgerMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
              <div className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Edit Fuel Record
              </div>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                    className="text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => handleInputChange('fuel_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="Pertalite">Pertalite</option>
                    <option value="Pertamax">Pertamax</option>
                    <option value="Pertamax Turbo">Pertamax Turbo</option>
                    <option value="Solar">Solar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity (L)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="e.g., 25.5"
                    required
                    className="text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price per Liter (Rp)
                  </label>
                  <Input
                    type="number"
                    value={formData.price_per_liter}
                    onChange={(e) => handleInputChange('price_per_liter', e.target.value)}
                    placeholder="e.g., 10000"
                    required
                    className="text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Cost (Rp)
                  </label>
                  <Input
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => handleInputChange('total_cost', e.target.value)}
                    placeholder="Auto-calculated"
                    required
                    className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Odometer (km)
                  </label>
                  <Input
                    type="number"
                    value={formData.odometer_km}
                    onChange={(e) => handleInputChange('odometer_km', e.target.value)}
                    placeholder="e.g., 50000"
                    className="text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Distance (km)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.distance_km}
                    onChange={(e) => handleInputChange('distance_km', e.target.value)}
                    placeholder="Auto-calculated"
                    className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Station
                  </label>
                  <Input
                    type="text"
                    value={formData.station}
                    onChange={(e) => handleInputChange('station', e.target.value)}
                    placeholder="e.g., Pertamina, Shell"
                    className="text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Link href="/dashboard/records" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
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