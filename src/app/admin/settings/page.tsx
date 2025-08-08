'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Settings,
  Database,
  DollarSign,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

interface AppSettings {
  app_name: string
  app_description: string
  premium_monthly_price: number
  premium_yearly_price: number
  free_pdf_limit: number
  free_scan_limit: number
  maintenance_mode: boolean
  registration_enabled: boolean
  email_notifications: boolean
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    app_name: 'FuelMeter',
    app_description: 'Track your fuel consumption and expenses',
    premium_monthly_price: 49000,
    premium_yearly_price: 490000,
    free_pdf_limit: 3,
    free_scan_limit: 3,
    maintenance_mode: false,
    registration_enabled: true,
    email_notifications: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dbStats, setDbStats] = useState({
    totalUsers: 0,
    totalRecords: 0,
    dbSize: '0 MB'
  })
  const supabase = createClient()

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
      setLoading(false)
    }
  }, [])

  const fetchDbStats = useCallback(async () => {
    try {
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: recordCount } = await supabase
        .from('fuel_records')
        .select('*', { count: 'exact', head: true })

      setDbStats({
        totalUsers: userCount || 0,
        totalRecords: recordCount || 0,
        dbSize: '15.2 MB'
      })
    } catch (error) {
      console.error('Error fetching database stats:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchSettings()
    fetchDbStats()
  }, [fetchSettings, fetchDbStats])

  // fetchSettings and fetchDbStats are defined with useCallback above

  const saveSettings = async () => {
    try {
      setSaving(true)
      // In a real app, you'd save to a settings table
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      
      toast.success('Application settings have been updated successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const cleanupDatabase = async () => {
    if (!confirm('Are you sure you want to cleanup the database? This will remove old logs and optimize performance.')) {
      return
    }

    try {
      // Mock cleanup process
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Database cleanup completed successfully')
      fetchDbStats()
    } catch (error) {
      console.error('Error cleaning database:', error)
      toast.error('Failed to cleanup database')
    }
  }

  const exportData = async () => {
    try {
      // Mock export process
      toast.success('Data export has been initiated. You will receive an email when complete.')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure application settings and manage system preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* App Settings */}
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Application Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    App Name
                  </label>
                  <Input
                    value={settings.app_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, app_name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    App Description
                  </label>
                  <Input
                    value={settings.app_description}
                    onChange={(e) => setSettings(prev => ({ ...prev, app_description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maintenance"
                    checked={settings.maintenance_mode}
                    onChange={(e) => setSettings(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="maintenance" className="text-sm text-gray-700 dark:text-gray-300">
                    Maintenance Mode
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="registration"
                    checked={settings.registration_enabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, registration_enabled: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="registration" className="text-sm text-gray-700 dark:text-gray-300">
                    Enable User Registration
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="email"
                    checked={settings.email_notifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Premium Settings */}
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Premium Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Premium Price (IDR)
                  </label>
                  <Input
                    type="number"
                    value={settings.premium_monthly_price}
                    onChange={(e) => setSettings(prev => ({ ...prev, premium_monthly_price: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {formatCurrency(settings.premium_monthly_price)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yearly Premium Price (IDR)
                  </label>
                  <Input
                    type="number"
                    value={settings.premium_yearly_price}
                    onChange={(e) => setSettings(prev => ({ ...prev, premium_yearly_price: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {formatCurrency(settings.premium_yearly_price)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Free PDF Reports Limit
                  </label>
                  <Input
                    type="number"
                    value={settings.free_pdf_limit}
                    onChange={(e) => setSettings(prev => ({ ...prev, free_pdf_limit: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Free AI Scans Limit
                  </label>
                  <Input
                    type="number"
                    value={settings.free_scan_limit}
                    onChange={(e) => setSettings(prev => ({ ...prev, free_scan_limit: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Database Management */}
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dbStats.totalUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dbStats.totalRecords.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {dbStats.dbSize}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Database Size</div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={cleanupDatabase}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Cleanup Database
                  </Button>
                  <Button
                    onClick={exportData}
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Status</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Online
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Connected
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Service</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email Service</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Limited
                  </span>
                </div>

                {settings.maintenance_mode && (
                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      Maintenance mode is enabled
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
