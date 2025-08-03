'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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
        // User has records, no need to show modal
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                🚗 Welcome to FuelMeter!
              </h2>
              <p className="text-white/70">
                To get started, please enter your current odometer reading. This will help us calculate distances for your fuel records.
              </p>
            </div>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Current odometer (km)"
                value={initialOdometer}
                onChange={(e) => setInitialOdometer(e.target.value)}
                className="backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl"
              />
              <button
                onClick={saveInitialOdometer}
                disabled={!initialOdometer}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>✨ Save & Continue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Plus className="h-6 w-6" />
                <span>⛽ Add Fuel Record</span>
              </h1>
            </div>
            <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    📅 Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                    className="backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    ⛽ Fuel Type
                  </label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => handleInputChange('fuel_type', e.target.value)}
                    className="w-full px-4 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="Pertalite" className="bg-gray-800 text-white">Pertalite</option>
                    <option value="Pertamax" className="bg-gray-800 text-white">Pertamax</option>
                    <option value="Pertamax Turbo" className="bg-gray-800 text-white">Pertamax Turbo</option>
                    <option value="Solar" className="bg-gray-800 text-white">Solar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    🔢 Quantity (L)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="e.g., 25.5"
                    required
                    className="backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    💰 Price per Liter (Rp)
                  </label>
                  <Input
                    type="number"
                    value={formData.price_per_liter}
                    onChange={(e) => handleInputChange('price_per_liter', e.target.value)}
                    placeholder="e.g., 10000"
                    required
                    className="backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    💵 Total Cost (Rp)
                  </label>
                  <Input
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => handleInputChange('total_cost', e.target.value)}
                    placeholder="Auto-calculated"
                    required
                    className="backdrop-blur-md bg-white/5 border border-white/20 text-white/60 placeholder-white/40 rounded-xl cursor-not-allowed"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    🚗 Current Odometer (km)
                  </label>
                  <Input
                    type="number"
                    value={formData.odometer_km}
                    onChange={(e) => handleInputChange('odometer_km', e.target.value)}
                    placeholder="e.g., 50000"
                    className="backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    🛣️ Distance (km)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.distance_km}
                    onChange={(e) => handleInputChange('distance_km', e.target.value)}
                    placeholder="Auto-calculated"
                    className="backdrop-blur-md bg-white/5 border border-white/20 text-white/60 placeholder-white/40 rounded-xl cursor-not-allowed"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    ⛽ Station
                  </label>
                  <Input
                    type="text"
                    value={formData.station}
                    onChange={(e) => handleInputChange('station', e.target.value)}
                    placeholder="e.g., Pertamina, Shell"
                    className="backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>💾 Save Record</span>
                  </>
                )}
              </button>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}