'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BurgerMenu } from '@/components/ui/menu'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'

// Data SPBU dan Bahan Bakar Indonesia dengan mapping
const FUEL_STATIONS = [
  'SPBU Pertamina', 'Shell', 'BP AKR', 'Total Energies', 'Vivo Energy',
  'SPBU Duta Energy', 'SPBU Petronas', 'SPBU Bright Gas', 'SPBU Primagas',
  'SPBU Esso', 'SPBU Mobil', 'SPBU Caltex', 'SPBU Agip', 'SPBU Texaco',
  'SPBU Chevron', 'SPBU ConocoPhillips', 'SPBU Lukoil', 'SPBU Gazprom', 'SPBU Rosneft'
]

// Mapping SPBU ke fuel types yang tersedia
const STATION_FUEL_MAPPING = {
  'SPBU Pertamina': ['Pertalite', 'Pertamax', 'Pertamax Turbo', 'Pertamax Green 95', 'Dexlite', 'Pertamina Dex', 'Bio Solar', 'Solar', 'Premium'],
  'Shell': ['Shell Super', 'Shell V-Power', 'Shell V-Power Racing', 'Shell V-Power Diesel', 'Shell V-Power Nitro+', 'Shell FuelSave 95', 'Shell FuelSave Diesel'],
  'BP AKR': ['BP Ultimate', 'BP 92', 'BP 95', 'BP Diesel', 'BP Ultimate Diesel'],
  'Total Energies': ['Total Quartz 7000', 'Total Excellium', 'Total Excellium Diesel'],
  'Vivo Energy': ['Vivo Revvo 90', 'Vivo Revvo 92', 'Vivo Revvo 95', 'Vivo Diesel'],
  'SPBU Duta Energy': ['Pertalite', 'Pertamax', 'Solar'],
  'SPBU Petronas': ['Petronas Primax 95', 'Petronas Primax 97', 'Petronas Diesel Max'],
  'SPBU Bright Gas': ['Premium', 'Pertalite', 'Solar'],
  'SPBU Primagas': ['Premium', 'Pertalite', 'Solar'],
  'SPBU Esso': ['Esso Super', 'Esso Diesel'],
  'SPBU Mobil': ['Mobil Super', 'Mobil Diesel'],
  'SPBU Caltex': ['Caltex Super', 'Caltex Diesel'],
  'SPBU Agip': ['Agip Super', 'Agip Diesel'],
  'SPBU Texaco': ['Texaco Super', 'Texaco Diesel'],
  'SPBU Chevron': ['Chevron Super', 'Chevron Diesel'],
  'SPBU ConocoPhillips': ['Phillips 66', 'Phillips Diesel'],
  'SPBU Lukoil': ['Lukoil 95', 'Lukoil Diesel'],
  'SPBU Gazprom': ['Gazprom 95', 'Gazprom Diesel'],
  'SPBU Rosneft': ['Rosneft 95', 'Rosneft Diesel']
}

const ALL_FUEL_TYPES = Object.values(STATION_FUEL_MAPPING).flat()

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
  const [inputMode, setInputMode] = useState<'quantity' | 'total'>('quantity') // New state for input mode
  const router = useRouter()
  const params = useParams()
  const recordId = params.id as string
  const supabase = createClient()
  const { success, error: showError } = useToast()

  // Get available fuel types based on selected station
  const getAvailableFuelTypes = (station: string): string[] => {
    return STATION_FUEL_MAPPING[station as keyof typeof STATION_FUEL_MAPPING] || ALL_FUEL_TYPES
  }

  // Handle station change and auto-select compatible fuel type
  const handleStationChange = (station: string) => {
    setFormData(prev => {
      const availableFuels = getAvailableFuelTypes(station)
      // Keep current fuel if compatible, otherwise select first available
      const newFuelType = availableFuels.includes(prev.fuel_type) ? prev.fuel_type : availableFuels[0] || 'Pertalite'

      return {
        ...prev,
        station,
        fuel_type: newFuelType
      }
    })
  }

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

      if (data) {
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
      }
    } catch (error) {
      console.error('Error fetching record:', error)
      showError('Record Not Found', 'The requested fuel record could not be found.')
      router.push('/dashboard/records')
    } finally {
      setLoading(false)
    }
  }, [supabase, recordId, router, showError])

  useEffect(() => {
    checkUser()
    fetchRecord()
  }, [checkUser, fetchRecord])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-calculate based on input mode
    if (inputMode === 'quantity') {
      // Mode 1: Calculate total cost from quantity × price per liter
      if (field === 'quantity' || field === 'price_per_liter') {
        const quantity = field === 'quantity' ? parseFloat(value) : parseFloat(formData.quantity)
        const price = field === 'price_per_liter' ? parseFloat(value) : parseFloat(formData.price_per_liter)

        if (!isNaN(quantity) && !isNaN(price)) {
          setFormData(prev => ({ ...prev, total_cost: (quantity * price).toString() }))
        }
      }
    } else if (inputMode === 'total') {
      // Mode 2: Calculate quantity from total cost ÷ price per liter
      if (field === 'total_cost' || field === 'price_per_liter') {
        const totalCost = field === 'total_cost' ? parseFloat(value) : parseFloat(formData.total_cost)
        const price = field === 'price_per_liter' ? parseFloat(value) : parseFloat(formData.price_per_liter)

        if (!isNaN(totalCost) && !isNaN(price) && price > 0) {
          const calculatedQuantity = totalCost / price
          setFormData(prev => ({ ...prev, quantity: calculatedQuantity.toFixed(2) }))
        }
      }
    }
  }

  const handleModeChange = (mode: 'quantity' | 'total') => {
    setInputMode(mode)
    // Clear calculated fields when switching modes
    if (mode === 'quantity') {
      // Clear total cost, keep quantity and price
      setFormData(prev => ({ ...prev, total_cost: '' }))
    } else {
      // Clear quantity, keep total cost and price
      setFormData(prev => ({ ...prev, quantity: '' }))
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

      success('Record Updated!', 'Your fuel record has been successfully updated.')
      router.push('/dashboard/records')
    } catch (error) {
      console.error('Error updating record:', error)
      showError('Update Failed', 'Failed to update record. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      success('Record Deleted!', 'The fuel record has been successfully deleted.')
      router.push('/dashboard/records')
    } catch (error) {
      console.error('Error deleting record:', error)
      showError('Delete Failed', 'Failed to delete record. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <BurgerMenu />
        <div className="flex items-center justify-center min-h-screen">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-white/80">Loading record...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <BurgerMenu />

      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            onClick={() => router.push('/dashboard/records')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Records
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Fuel Record
          </h1>
        </div>

        {/* Form */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Update Fuel Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Input Mode Toggle */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📝 Input Method</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleModeChange('quantity')}
                  className={`flex-1 p-3 rounded-lg border transition-all duration-300 ${
                    inputMode === 'quantity'
                      ? 'bg-blue-500/20 border-blue-400 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">🔢</div>
                    <div className="font-medium">By Quantity</div>
                    <div className="text-xs opacity-75">Enter liters + price per liter</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('total')}
                  className={`flex-1 p-3 rounded-lg border transition-all duration-300 ${
                    inputMode === 'total'
                      ? 'bg-purple-500/20 border-purple-400 text-purple-700 dark:text-purple-300'
                      : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">🧾</div>
                    <div className="font-medium">From Receipt</div>
                    <div className="text-xs opacity-75">Enter total cost from receipt</div>
                  </div>
                </button>
              </div>

              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-start space-x-2 text-yellow-800 dark:text-yellow-200 text-sm">
                  <span className="text-yellow-600 dark:text-yellow-400">💡</span>
                  <div>
                    <strong>
                      {inputMode === 'quantity' ? 'Quantity Mode:' : 'Receipt Mode:'}
                    </strong>
                    <span className="ml-1">
                      {inputMode === 'quantity'
                        ? 'Total cost will be calculated automatically (Quantity × Price per Liter)'
                        : 'Quantity will be calculated automatically (Total Cost ÷ Price per Liter)'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    📅 Date
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('date', new Date().toISOString().split('T')[0])}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const yesterday = new Date()
                          yesterday.setDate(yesterday.getDate() - 1)
                          handleInputChange('date', yesterday.toISOString().split('T')[0])
                        }}
                        className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gas Station
                  </label>
                  <select
                    value={formData.station}
                    onChange={(e) => handleStationChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select gas station</option>
                    <optgroup label="🔴 Pertamina">
                      <option value="SPBU Pertamina">SPBU Pertamina</option>
                    </optgroup>
                    <optgroup label="🟡 Shell">
                      <option value="Shell">Shell</option>
                    </optgroup>
                    <optgroup label="🟢 BP">
                      <option value="BP AKR">BP AKR</option>
                    </optgroup>
                    <optgroup label="🔵 Total Energies">
                      <option value="Total Energies">Total Energies</option>
                    </optgroup>
                    <optgroup label="🟠 Vivo Energy">
                      <option value="Vivo Energy">Vivo Energy</option>
                    </optgroup>
                    <optgroup label="⚫ SPBU Lainnya">
                      {FUEL_STATIONS.filter(station =>
                        !['SPBU Pertamina', 'Shell', 'BP AKR', 'Total Energies', 'Vivo Energy'].includes(station)
                      ).map(station => (
                        <option key={station} value={station}>{station}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fuel Type
                    <span className="text-xs text-gray-500 ml-2">
                      (Available for {formData.station || 'selected station'})
                    </span>
                  </label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => handleInputChange('fuel_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select fuel type</option>
                    {formData.station && getAvailableFuelTypes(formData.station).map(fuel => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                  {formData.station && (
                    <p className="text-xs text-gray-500 mt-1">
                      {getAvailableFuelTypes(formData.station).length} fuel types available for {formData.station}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    🔢 Quantity (L)
                    {inputMode === 'total' && <span className="text-yellow-600 dark:text-yellow-400 text-xs ml-2">(Auto-calculated)</span>}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder={inputMode === 'quantity' ? "e.g., 25.5" : "Auto-calculated from total cost"}
                    required
                    readOnly={inputMode === 'total'}
                    className={inputMode === 'total' ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''}
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    💵 Total Cost (Rp)
                    {inputMode === 'quantity' && <span className="text-yellow-600 dark:text-yellow-400 text-xs ml-2">(Auto-calculated)</span>}
                  </label>
                  <Input
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => handleInputChange('total_cost', e.target.value)}
                    placeholder={inputMode === 'total' ? "Enter total from receipt (e.g., 255000)" : "Auto-calculated"}
                    required
                    readOnly={inputMode === 'quantity'}
                    className={inputMode === 'quantity' ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''}
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
                    placeholder="e.g., 150.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Odometer (km)
                  </label>
                  <Input
                    type="number"
                    value={formData.odometer_km}
                    onChange={(e) => handleInputChange('odometer_km', e.target.value)}
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Record
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 