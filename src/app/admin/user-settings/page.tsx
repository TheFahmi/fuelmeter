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
  Search,
  Settings,
  User,
  Car,
  Shield,
  Download,
  Eye
} from 'lucide-react'

interface UserSettingsData {
  id: string
  user_id: string
  display_name: string
  vehicle_type: string
  vehicle_model: string
  license_plate: string
  fuel_capacity: number
  monthly_budget: number
  currency: string
  notification_settings: {
    budgetAlerts: boolean
    serviceReminders: boolean
    lowFuelAlerts: boolean
    achievementNotifications: boolean
    weeklyReports: boolean
    priceAlerts: boolean
    pushEnabled: boolean
    emailEnabled: boolean
  }
  privacy_settings: {
    shareData: boolean
    publicProfile: boolean
    analyticsOptOut: boolean
  }
  theme_preference: string
  language_preference: string
  created_at: string
  updated_at: string
  profiles: {
    email: string
    full_name: string
    is_premium: boolean
  }
}

export default function AdminUserSettings() {
  const [userSettings, setUserSettings] = useState<UserSettingsData[]>([])
  const [filteredSettings, setFilteredSettings] = useState<UserSettingsData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'free' | 'incomplete'>('all')
  const [selectedUser, setSelectedUser] = useState<UserSettingsData | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const supabase = createClient()

  const fetchUserSettings = useCallback(async () => {
    try {
      setLoading(true)

      // First get user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .order('updated_at', { ascending: false })

      if (settingsError) throw settingsError

      // Then get profiles data and merge
      const userSettingsWithProfiles = await Promise.all(
        (settingsData || []).map(async (setting) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name, is_premium')
            .eq('id', setting.user_id)
            .single()

          return {
            ...setting,
            profiles: profile || { email: 'Unknown', full_name: 'Unknown', is_premium: false }
          }
        })
      )

      setUserSettings(userSettingsWithProfiles)
    } catch (error) {
      console.error('Error fetching user settings:', error)
      toast.error('Failed to load user settings')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const filterUserSettings = useCallback(() => {
    let filtered = userSettings

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(setting => 
        setting.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    switch (filterType) {
      case 'premium':
        filtered = filtered.filter(setting => setting.profiles.is_premium)
        break
      case 'free':
        filtered = filtered.filter(setting => !setting.profiles.is_premium)
        break
      case 'incomplete':
        filtered = filtered.filter(setting => 
          !setting.display_name || 
          !setting.vehicle_model || 
          !setting.license_plate ||
          setting.monthly_budget === 0
        )
        break
    }

    setFilteredSettings(filtered)
  }, [userSettings, searchTerm, filterType])

  useEffect(() => {
    fetchUserSettings()
  }, [fetchUserSettings])

  useEffect(() => {
    filterUserSettings()
  }, [filterUserSettings])

  const exportUserSettings = () => {
    const csvContent = [
      ['Email', 'Display Name', 'Vehicle Type', 'Vehicle Model', 'License Plate', 'Fuel Capacity', 'Monthly Budget', 'Currency', 'Theme', 'Language', 'Is Premium'].join(','),
      ...filteredSettings.map(setting => [
        setting.profiles.email,
        setting.display_name || '',
        setting.vehicle_type || '',
        setting.vehicle_model || '',
        setting.license_plate || '',
        setting.fuel_capacity || 0,
        setting.monthly_budget || 0,
        setting.currency || 'IDR',
        setting.theme_preference || 'system',
        setting.language_preference || 'id',
        setting.profiles.is_premium ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user_settings_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('User settings have been exported to CSV')
  }

  const resetUserSettings = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s settings to default values?')) {
      return
    }

    try {
      const defaultSettings = {
        display_name: '',
        vehicle_type: 'car',
        vehicle_model: '',
        license_plate: '',
        fuel_capacity: 50.00,
        monthly_budget: 500000.00,
        currency: 'IDR',
        theme_preference: 'system',
        language_preference: 'id',
        notification_settings: {
          budgetAlerts: true,
          serviceReminders: true,
          lowFuelAlerts: true,
          achievementNotifications: true,
          weeklyReports: true,
          priceAlerts: true,
          pushEnabled: false,
          emailEnabled: true
        },
        privacy_settings: {
          shareData: false,
          publicProfile: false,
          analyticsOptOut: false
        }
      }

      const { error } = await supabase
        .from('user_settings')
        .update(defaultSettings)
        .eq('user_id', userId)

      if (error) throw error

      toast.success('User settings have been reset to default values')
      fetchUserSettings()
    } catch (error) {
      console.error('Error resetting user settings:', error)
      toast.error('Failed to reset user settings')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getCompletionPercentage = (setting: UserSettingsData) => {
    const fields = [
      setting.display_name,
      setting.vehicle_model,
      setting.license_plate,
      setting.monthly_budget > 0,
      setting.fuel_capacity > 0
    ]
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Settings Management</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor and manage user preferences and configurations
                </p>
              </div>
              <Button onClick={exportUserSettings} className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Users</CardTitle>
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{userSettings.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Complete Profiles</CardTitle>
                <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userSettings.filter(s => getCompletionPercentage(s) >= 80).length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Premium Users</CardTitle>
                <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userSettings.filter(s => s.profiles.is_premium).length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Avg Budget</CardTitle>
                <Car className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(
                    userSettings.length > 0
                      ? userSettings.reduce((sum, s) => sum + (s.monthly_budget || 0), 0) / userSettings.length
                      : 0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by email, name, vehicle, or license plate..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterType === 'all' ? 'primary' : 'outline'}
                    onClick={() => setFilterType('all')}
                    size="sm"
                  >
                    All ({userSettings.length})
                  </Button>
                  <Button
                    variant={filterType === 'premium' ? 'primary' : 'outline'}
                    onClick={() => setFilterType('premium')}
                    size="sm"
                  >
                    Premium ({userSettings.filter(s => s.profiles.is_premium).length})
                  </Button>
                  <Button
                    variant={filterType === 'free' ? 'primary' : 'outline'}
                    onClick={() => setFilterType('free')}
                    size="sm"
                  >
                    Free ({userSettings.filter(s => !s.profiles.is_premium).length})
                  </Button>
                  <Button
                    variant={filterType === 'incomplete' ? 'primary' : 'outline'}
                    onClick={() => setFilterType('incomplete')}
                    size="sm"
                  >
                    Incomplete ({userSettings.filter(s => getCompletionPercentage(s) < 80).length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Settings Table */}
          <Card className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">User Settings ({filteredSettings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Vehicle</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Budget</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Completion</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Updated</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSettings.map((setting) => (
                      <tr key={setting.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {setting.profiles.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {setting.display_name || setting.profiles.email}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {setting.profiles.email}
                              </div>
                              {setting.profiles.is_premium && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Premium
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {setting.vehicle_model || 'Not specified'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {setting.vehicle_type} • {setting.license_plate || 'No plate'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {setting.fuel_capacity}L capacity
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(setting.monthly_budget || 0, setting.currency)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  getCompletionPercentage(setting) >= 80 
                                    ? 'bg-green-600' 
                                    : getCompletionPercentage(setting) >= 50 
                                    ? 'bg-yellow-600' 
                                    : 'bg-red-600'
                                }`}
                                style={{ width: `${getCompletionPercentage(setting)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {getCompletionPercentage(setting)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(setting.updated_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(setting)
                                setShowDetailModal(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resetUserSettings(setting.user_id)}
                            >
                              Reset
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredSettings.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No user settings found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detail Modal */}
          {showDetailModal && selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      User Settings Details
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetailModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.profiles.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.display_name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Type</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.vehicle_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Model</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.vehicle_model || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">License Plate</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.license_plate || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fuel Capacity</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.fuel_capacity}L</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Budget</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(selectedUser.monthly_budget, selectedUser.currency)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedUser.theme_preference}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notification Settings</label>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(selectedUser.notification_settings, null, 2)}
                      </pre>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Privacy Settings</label>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(selectedUser.privacy_settings, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
