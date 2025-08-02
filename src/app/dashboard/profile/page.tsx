'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BurgerMenu } from '@/components/ui/menu'
import { User, Save, Download, Trash2, Settings } from 'lucide-react'

interface UserSettings {
  display_name?: string
  vehicle_type?: string
  fuel_capacity?: number
  monthly_budget?: number
  currency?: string
  last_service_date?: string
  service_interval_days?: number
}

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    display_name: '',
    vehicle_type: '',
    fuel_capacity: '',
    monthly_budget: '',
    currency: 'IDR',
    last_service_date: '',
    service_interval_days: '90'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const loadProfile = useCallback(async () => {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
      }

      if (settings) {
        setFormData({
          display_name: settings.display_name || '',
          vehicle_type: settings.vehicle_type || '',
          fuel_capacity: settings.fuel_capacity?.toString() || '',
          monthly_budget: settings.monthly_budget?.toString() || '',
          currency: settings.currency || 'IDR',
          last_service_date: settings.last_service_date || '',
          service_interval_days: settings.service_interval_days?.toString() || '90'
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          display_name: formData.display_name || null,
          vehicle_type: formData.vehicle_type || null,
          fuel_capacity: parseFloat(formData.fuel_capacity) || null,
          monthly_budget: parseFloat(formData.monthly_budget) || null,
          currency: formData.currency,
          last_service_date: formData.last_service_date || null,
          service_interval_days: parseInt(formData.service_interval_days) || 90
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        // Fallback to insert if upsert fails
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            display_name: formData.display_name || null,
            vehicle_type: formData.vehicle_type || null,
            fuel_capacity: parseFloat(formData.fuel_capacity) || null,
            monthly_budget: parseFloat(formData.monthly_budget) || null,
            currency: formData.currency,
            last_service_date: formData.last_service_date || null,
            service_interval_days: parseInt(formData.service_interval_days) || 90
          })

        if (insertError) throw insertError
      }

      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    try {
      const { data: records, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      // Create CSV content
      const headers = ['Date', 'Fuel Type', 'Quantity (L)', 'Price per Liter (Rp)', 'Total Cost (Rp)', 'Distance (km)', 'Odometer (km)', 'Station']
      const csvContent = [
        headers.join(','),
        ...(records || []).map(record => [
          record.date,
          record.fuel_type,
          record.quantity,
          record.price_per_liter,
          record.total_cost,
          record.distance_km,
          record.odometer_km,
          record.station
        ].join(','))
      ].join('\n')

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fuelmeter_data_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      alert('Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to delete ALL your data? This action cannot be undone.')) {
      return
    }

    try {
      // Delete all fuel records
      const { error: recordsError } = await supabase
        .from('fuel_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

      if (recordsError) throw recordsError

      // Delete user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all settings

      if (settingsError) throw settingsError

      alert('All data cleared successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error clearing data:', error)
      alert('Failed to clear data. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <BurgerMenu />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BurgerMenu />
      
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your profile and application settings
          </p>
        </div>

        {/* Profile Form */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Type
                  </label>
                  <Input
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                    placeholder="e.g., Honda Civic, Toyota Avanza"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fuel Capacity (L)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fuel_capacity}
                    onChange={(e) => setFormData({...formData, fuel_capacity: e.target.value})}
                    placeholder="e.g., 45"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Budget (Rp)
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_budget}
                    onChange={(e) => setFormData({...formData, monthly_budget: e.target.value})}
                    placeholder="e.g., 500000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="IDR">IDR (Indonesian Rupiah)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Service Date
                  </label>
                  <Input
                    type="date"
                    value={formData.last_service_date}
                    onChange={(e) => setFormData({...formData, last_service_date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Interval (Days)
                  </label>
                  <Input
                    type="number"
                    value={formData.service_interval_days}
                    onChange={(e) => setFormData({...formData, service_interval_days: e.target.value})}
                    placeholder="e.g., 90"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Settings className="h-5 w-5 mr-2" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={exportData}
                variant="outline"
                className="h-12"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data (CSV)
              </Button>
              
              <Button
                onClick={clearAllData}
                variant="outline"
                className="h-12 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <p className="font-medium mb-1">⚠️ Warning:</p>
              <ul className="space-y-1">
                <li>• Export data creates a CSV file with all your fuel records</li>
                <li>• Clear all data permanently deletes all your records and settings</li>
                <li>• These actions cannot be undone</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 