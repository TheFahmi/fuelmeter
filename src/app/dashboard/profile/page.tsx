'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useUserSettings } from '@/contexts/user-settings-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BurgerMenu } from '@/components/ui/menu'
import { Settings, Download, Trash2, AlertTriangle } from 'lucide-react'
import { formatLicensePlate } from '@/lib/utils'

export default function ProfilePage() {
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings()
  const [formData, setFormData] = useState({
    display_name: '',
    vehicle_type: '',
    vehicle_model: '',
    license_plate: '',
    monthly_budget: '',
    currency: 'IDR',
    last_service_date: '',
    service_interval_days: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }, [supabase, router])



  useEffect(() => {
    if (settings && !settingsLoading) {
      setFormData({
        display_name: settings.display_name || '',
        vehicle_type: settings.vehicle_type || '',
        vehicle_model: settings.vehicle_model || '',
        license_plate: settings.license_plate || '',
        monthly_budget: settings.monthly_budget?.toString() || '',
        currency: settings.currency || 'IDR',
        last_service_date: settings.last_service_date || '',
        service_interval_days: settings.service_interval_days?.toString() || ''
      })
      setLoading(false)
    }
  }, [settings, settingsLoading])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const success = await updateSettings({
        display_name: formData.display_name,
        vehicle_type: formData.vehicle_type,
        vehicle_model: formData.vehicle_model,
        license_plate: formData.license_plate,
        monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : 0,
        currency: formData.currency,
        last_service_date: formData.last_service_date || '',
        service_interval_days: formData.service_interval_days ? parseInt(formData.service_interval_days) : 90
      })

      if (!success) {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
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

      const csvContent = [
        ['Date', 'Fuel Type', 'Quantity (L)', 'Price per Liter', 'Total Cost', 'Distance (km)', 'Odometer (km)', 'Station'],
        ...(records || []).map(record => [
          record.date,
          record.fuel_type,
          record.quantity.toString(),
          record.price_per_liter.toString(),
          record.total_cost.toString(),
          record.distance_km.toString(),
          record.odometer_km.toString(),
          record.station || ''
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fuel_records_${new Date().toISOString().split('T')[0]}.csv`
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
      // Delete fuel records
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

      alert('All data has been cleared successfully!')
      setFormData({
        display_name: '',
        vehicle_type: '',
        vehicle_model: '',
        license_plate: '',
        monthly_budget: '',
        currency: 'IDR',
        last_service_date: '',
        service_interval_days: ''
      })
    } catch (error) {
      console.error('Error clearing data:', error)
      alert('Failed to clear data. Please try again.')
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
              <p className="mt-4 text-white/80">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
<div className="min-h-screen pb-28 sm:pb-6">
      <BurgerMenu />

      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              👤 Profile Settings
            </h1>
            <p className="text-gray-700 dark:text-white/70 text-lg">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Settings className="h-5 w-5 mr-2" />
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
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Type
                  </label>
                  <Input
                    type="text"
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_type: e.target.value }))}
                    placeholder="e.g., Car, Motorcycle, Truck"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Model
                  </label>
                  <Input
                    type="text"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_model: e.target.value }))}
                    placeholder="e.g., Toyota Avanza, Honda Vario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    License Plate
                  </label>
                  <Input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => {
                      const formatted = formatLicensePlate(e.target.value)
                      setFormData(prev => ({ ...prev, license_plate: formatted }))
                    }}
                    placeholder="e.g., d1234abc (auto-formats to D 1234 ABC)"
                    maxLength={12}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Budget
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_budget: e.target.value }))}
                    placeholder="Enter monthly budget"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, last_service_date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Interval (Days)
                  </label>
                  <Input
                    type="number"
                    value={formData.service_interval_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_interval_days: e.target.value }))}
                    placeholder="e.g., 90 days"
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
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Data Management
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Export your data for backup or clear all data to start fresh.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={exportData}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data (CSV)
              </Button>

              <Button
                onClick={clearAllData}
                variant="outline"
                className="flex items-center justify-center text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 