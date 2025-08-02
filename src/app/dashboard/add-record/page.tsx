'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import Link from 'next/link'

export default function AddRecordPage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fuel_type: 'Pertalite',
    quantity: '',
    price_per_liter: '',
    total_cost: '',
    distance_km: '',
    odometer_km: '',
    station: ''
  })
  const [loading, setLoading] = useState(false)
  const [hasInitialOdometer, setHasInitialOdometer] = useState(false)
  const [showOdometerModal, setShowOdometerModal] = useState(false)
  const [initialOdometer, setInitialOdometer] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }, [supabase, router])

  const checkUserRecords = useCallback(async () => {
    try {
      const { data: records } = await supabase
        .from('fuel_records')
        .select('odometer_km')
        .order('created_at', { ascending: false })
        .limit(1)

      if (records && records.length > 0 && records[0].odometer_km) {
        setHasInitialOdometer(true)
      } else {
        setShowOdometerModal(true)
      }
    } catch (error) {
      console.error('Error checking user records:', error)
      setShowOdometerModal(true)
    }
  }, [supabase])

  useEffect(() => {
    checkUser()
    checkUserRecords()
  }, [checkUser, checkUserRecords])

  const saveInitialOdometer = async () => {
    if (!initialOdometer) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Try to upsert user settings
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          initial_odometer: parseFloat(initialOdometer)
        }, {
          onConflict: 'user_id'
        })

      if (upsertError) {
        // Fallback to insert if upsert fails
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            initial_odometer: parseFloat(initialOdometer)
          })

        if (insertError) {
          throw insertError
        }
      }

      setHasInitialOdometer(true)
      setShowOdometerModal(false)
    } catch (error) {
      console.error('Error saving initial odometer:', error)
      alert('Failed to save initial odometer. Please try again.')
    }
  }

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

    // Auto-calculate distance if odometer is provided
    if (field === 'odometer_km') {
      const currentOdometer = parseFloat(value)
      if (!isNaN(currentOdometer)) {
        // Get previous odometer reading
        getPreviousOdometer().then(prevOdometer => {
          if (prevOdometer && currentOdometer > prevOdometer) {
            const distance = currentOdometer - prevOdometer
            setFormData(prev => ({ ...prev, distance_km: distance.toString() }))
          }
        })
      }
    }
  }

  const getPreviousOdometer = async () => {
    try {
      const { data: records } = await supabase
        .from('fuel_records')
        .select('odometer_km')
        .order('created_at', { ascending: false })
        .limit(1)

      return records && records.length > 0 ? records[0].odometer_km : null
    } catch (error) {
      console.error('Error getting previous odometer:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const recordData = {
        user_id: user.id,
        date: formData.date,
        fuel_type: formData.fuel_type,
        quantity: parseFloat(formData.quantity),
        price_per_liter: parseFloat(formData.price_per_liter),
        total_cost: parseFloat(formData.total_cost),
        distance_km: parseFloat(formData.distance_km) || 0,
        odometer_km: parseFloat(formData.odometer_km) || null,
        station: formData.station || null
      }

      const { error } = await supabase
        .from('fuel_records')
        .insert(recordData)

      if (error) throw error

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        fuel_type: 'Pertalite',
        quantity: '',
        price_per_liter: '',
        total_cost: '',
        distance_km: '',
        odometer_km: '',
        station: ''
      })

      alert('Fuel record added successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving fuel record:', error)
      alert('Failed to save fuel record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (showOdometerModal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Welcome to FuelMeter!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              To get started, please enter your current odometer reading. This will help us calculate distances for your fuel records.
            </p>
            <Input
              type="number"
              placeholder="Current odometer (km)"
              value={initialOdometer}
              onChange={(e) => setInitialOdometer(e.target.value)}
              className="text-gray-900 dark:text-white"
            />
            <Button
              onClick={saveInitialOdometer}
              disabled={!initialOdometer}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save & Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Plus className="h-5 w-5 mr-2" />
              Add Fuel Record
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Record
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 