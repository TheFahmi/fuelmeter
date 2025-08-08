'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/contexts/toast-context'

interface NotificationSettings {
  budgetAlerts: boolean
  serviceReminders: boolean
  lowFuelAlerts: boolean
  achievementNotifications: boolean
  weeklyReports: boolean
  priceAlerts: boolean
  pushEnabled: boolean
  emailEnabled: boolean
}

interface PrivacySettings {
  shareData: boolean
  publicProfile: boolean
  analyticsOptOut: boolean
}

interface UserSettings {
  id?: string
  user_id?: string
  initial_odometer: number
  display_name: string
  vehicle_type: string
  vehicle_model: string
  license_plate: string
  fuel_capacity: number
  fuel_efficiency_km_l: number
  monthly_budget: number
  currency: string
  last_service_date: string
  service_interval_days: number
  carbon_goal_kg: number
  carbon_intensity_kg_co2_l: number
  challenge_points: number
  achievements_count: number
  notification_settings: NotificationSettings
  privacy_settings: PrivacySettings
  theme_preference: 'light' | 'dark' | 'system'
  language_preference: 'id' | 'en'
  timezone: string
  created_at?: string
  updated_at?: string
}

interface UserSettingsContextType {
  settings: UserSettings | null
  loading: boolean
  updateSettings: (updates: Partial<UserSettings>) => Promise<boolean>
  resetSettings: () => Promise<boolean>
  exportSettings: () => string
  importSettings: (settingsJson: string) => Promise<boolean>
}

const defaultSettings: UserSettings = {
  initial_odometer: 0,
  display_name: '',
  vehicle_type: 'car',
  vehicle_model: '',
  license_plate: '',
  fuel_capacity: 50.00,
  fuel_efficiency_km_l: 10.00,
  monthly_budget: 500000.00,
  currency: 'IDR',
  last_service_date: '',
  service_interval_days: 90,
  carbon_goal_kg: 1000.00,
  carbon_intensity_kg_co2_l: 2.31,
  challenge_points: 0,
  achievements_count: 0,
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
  },
  theme_preference: 'system',
  language_preference: 'id',
  timezone: 'Asia/Jakarta'
}

const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: null,
  loading: true,
  updateSettings: async () => false,
  resetSettings: async () => false,
  exportSettings: () => '',
  importSettings: async () => false
})

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}

interface UserSettingsProviderProps {
  children: ReactNode
}

export function UserSettingsProvider({ children }: UserSettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const createDefaultSettings = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert([{ user_id: userId, ...defaultSettings }])
        .select()
        .single()
      if (error) throw error
      setSettings(data)
    } catch (error) {
      console.error('Error creating default settings:', error)
      setSettings(defaultSettings)
    }
  }, [supabase])

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setSettings(null)
        return
      }

      const { data: userSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user settings:', error)
        await createDefaultSettings(user.id)
      } else if (userSettings) {
        setSettings(userSettings)
      } else {
        await createDefaultSettings(user.id)
      }
    } catch (error) {
      console.error('Error in loadSettings:', error)
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }, [supabase, createDefaultSettings])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // duplicate createDefaultSettings removed; using useCallback version above

  const updateSettings = async (updates: Partial<UserSettings>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setSettings(data)
      success('Settings Updated', 'Your preferences have been saved successfully.')
      return true
    } catch (error) {
      console.error('Error updating settings:', error)
      showError('Update Failed', 'Failed to save your settings. Please try again.')
      return false
    }
  }

  const resetSettings = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('user_settings')
        .update(defaultSettings)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setSettings(data)
      success('Settings Reset', 'Your settings have been reset to default values.')
      return true
    } catch (error) {
      console.error('Error resetting settings:', error)
      showError('Reset Failed', 'Failed to reset settings. Please try again.')
      return false
    }
  }

  const exportSettings = (): string => {
    if (!settings) return ''
    
    const exportData = {
      ...settings,
      exported_at: new Date().toISOString(),
      version: '1.0'
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  const importSettings = async (settingsJson: string): Promise<boolean> => {
    try {
      const importedData = JSON.parse(settingsJson)
      
      // Validate imported data
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid settings format')
      }

      // Remove metadata fields
      const cleanSettings: Partial<UserSettings> & Record<string, unknown> = { ...importedData }
      delete cleanSettings.exported_at as unknown as never
      delete cleanSettings.exported_at
      delete cleanSettings.version
      delete cleanSettings.id
      delete cleanSettings.user_id
      delete cleanSettings.created_at
      delete cleanSettings.updated_at

      // Merge with current settings
      const updatedSettings = {
        ...defaultSettings,
        ...cleanSettings
      }

      const updateSuccess = await updateSettings(updatedSettings)
      if (updateSuccess) {
        success('Settings Imported', 'Your settings have been imported successfully.')
      }
      return updateSuccess
    } catch (error) {
      console.error('Error importing settings:', error)
      showError('Import Failed', 'Invalid settings file or format.')
      return false
    }
  }

  return (
    <UserSettingsContext.Provider value={{
      settings,
      loading,
      updateSettings,
      resetSettings,
      exportSettings,
      importSettings
    }}>
      {children}
    </UserSettingsContext.Provider>
  )
}

// Helper hooks for specific settings
export function useNotificationSettings() {
  const { settings, updateSettings } = useUserSettings()
  
  const updateNotificationSettings = async (updates: Partial<NotificationSettings>) => {
    if (!settings) return false
    
    const newNotificationSettings = {
      ...settings.notification_settings,
      ...updates
    }
    
    return await updateSettings({
      notification_settings: newNotificationSettings
    })
  }

  return {
    notificationSettings: settings?.notification_settings || defaultSettings.notification_settings,
    updateNotificationSettings
  }
}

export function usePrivacySettings() {
  const { settings, updateSettings } = useUserSettings()
  
  const updatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    if (!settings) return false
    
    const newPrivacySettings = {
      ...settings.privacy_settings,
      ...updates
    }
    
    return await updateSettings({
      privacy_settings: newPrivacySettings
    })
  }

  return {
    privacySettings: settings?.privacy_settings || defaultSettings.privacy_settings,
    updatePrivacySettings
  }
}

export function useVehicleSettings() {
  const { settings, updateSettings } = useUserSettings()
  
  const updateVehicleSettings = async (updates: {
    vehicle_type?: string
    vehicle_model?: string
    license_plate?: string
    fuel_capacity?: number
    fuel_efficiency_km_l?: number
  }) => {
    return await updateSettings(updates)
  }

  return {
    vehicleSettings: {
      vehicle_type: settings?.vehicle_type || defaultSettings.vehicle_type,
      vehicle_model: settings?.vehicle_model || defaultSettings.vehicle_model,
      license_plate: settings?.license_plate || defaultSettings.license_plate,
      fuel_capacity: settings?.fuel_capacity || defaultSettings.fuel_capacity,
      fuel_efficiency_km_l: settings?.fuel_efficiency_km_l || defaultSettings.fuel_efficiency_km_l
    },
    updateVehicleSettings
  }
}
