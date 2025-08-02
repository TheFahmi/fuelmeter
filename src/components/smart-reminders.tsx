'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Fuel, DollarSign, Wrench, Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Reminder {
  id: string
  type: 'low_fuel' | 'budget_warning' | 'service_reminder' | 'price_drop'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high'
  isRead: boolean
  createdAt: string
}

interface VehicleInfo {
  fuel_capacity: number
  current_fuel_level?: number
  last_service_date?: string
  service_interval_days: number
}

export function SmartReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadReminders()
    loadVehicleInfo()
  }, [])

  const loadReminders = async () => {
    try {
      // Get user settings for budget
      const { data: settings } = await supabase
        .from('user_settings')
        .select('monthly_budget, fuel_capacity')
        .single()

      // Get current month spending
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const { data: records } = await supabase
        .from('fuel_records')
        .select('total_cost, quantity, date')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0])

      const currentSpent = records?.reduce((sum, record) => sum + record.total_cost, 0) || 0
      const monthlyBudget = settings?.monthly_budget || 0

      const newReminders: Reminder[] = []

      // Budget warning
      if (monthlyBudget > 0) {
        const budgetPercentage = (currentSpent / monthlyBudget) * 100
        if (budgetPercentage >= 80 && budgetPercentage < 100) {
          newReminders.push({
            id: 'budget_warning',
            type: 'budget_warning',
            title: 'Budget Warning',
            message: `Anda telah menghabiskan ${budgetPercentage.toFixed(1)}% dari budget bulanan. Sisa: Rp ${(monthlyBudget - currentSpent).toLocaleString()}`,
            severity: 'medium',
            isRead: false,
            createdAt: new Date().toISOString()
          })
        } else if (budgetPercentage >= 100) {
          newReminders.push({
            id: 'budget_exceeded',
            type: 'budget_warning',
            title: 'Budget Exceeded!',
            message: `Anda telah melebihi budget bulanan sebesar Rp ${(currentSpent - monthlyBudget).toLocaleString()}`,
            severity: 'high',
            isRead: false,
            createdAt: new Date().toISOString()
          })
        }
      }

      // Low fuel reminder (if we have fuel capacity info)
      if (settings?.fuel_capacity) {
        const lastRecord = records?.[0]
        if (lastRecord) {
          // Estimate current fuel level based on last fill
          const estimatedFuelLevel = lastRecord.quantity * 0.3 // Assume 30% remaining
          if (estimatedFuelLevel < (settings.fuel_capacity * 0.2)) { // Less than 20%
            newReminders.push({
              id: 'low_fuel',
              type: 'low_fuel',
              title: 'Low Fuel Alert',
              message: `Perkiraan BBM tersisa sekitar ${estimatedFuelLevel.toFixed(1)}L. Segera isi BBM!`,
              severity: 'high',
              isRead: false,
              createdAt: new Date().toISOString()
            })
          }
        }
      }

      // Service reminder
      const { data: serviceSettings } = await supabase
        .from('user_settings')
        .select('last_service_date, service_interval_days')
        .single()

      if (serviceSettings?.last_service_date && serviceSettings?.service_interval_days) {
        const lastService = new Date(serviceSettings.last_service_date)
        const daysSinceService = Math.floor((now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24))
        const daysUntilService = serviceSettings.service_interval_days - daysSinceService

        if (daysUntilService <= 7 && daysUntilService > 0) {
          newReminders.push({
            id: 'service_reminder',
            type: 'service_reminder',
            title: 'Service Reminder',
            message: `Servis berkala dalam ${daysUntilService} hari. Jadwalkan servis sekarang!`,
            severity: 'medium',
            isRead: false,
            createdAt: new Date().toISOString()
          })
        } else if (daysUntilService <= 0) {
          newReminders.push({
            id: 'service_overdue',
            type: 'service_reminder',
            title: 'Service Overdue!',
            message: `Servis berkala terlambat ${Math.abs(daysUntilService)} hari. Segera servis kendaraan!`,
            severity: 'high',
            isRead: false,
            createdAt: new Date().toISOString()
          })
        }
      }

      setReminders(newReminders)
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVehicleInfo = async () => {
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('fuel_capacity, last_service_date, service_interval_days')
        .single()

      if (settings) {
        setVehicleInfo({
          fuel_capacity: settings.fuel_capacity || 0,
          last_service_date: settings.last_service_date,
          service_interval_days: settings.service_interval_days || 90
        })
      }
    } catch (error) {
      console.error('Error loading vehicle info:', error)
    }
  }

  const markAsRead = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_fuel': return <Fuel className="h-5 w-5" />
      case 'budget_warning': return <DollarSign className="h-5 w-5" />
      case 'service_reminder': return <Wrench className="h-5 w-5" />
      case 'price_drop': return <AlertTriangle className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reminders.length === 0) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Bell className="h-5 w-5 mr-2" />
            Smart Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Tidak ada reminder saat ini. Semua baik-baik saja! 👍
          </p>
        </CardContent>
      </Card>
    )
  }

  const displayedReminders = showAll ? reminders : reminders.slice(0, 3)

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <Bell className="h-5 w-5 mr-2" />
          Smart Reminders
          {reminders.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
              {reminders.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedReminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`p-4 rounded-lg border ${getSeverityColor(reminder.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getIcon(reminder.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{reminder.title}</h4>
                  <p className="text-sm mt-1">{reminder.message}</p>
                </div>
              </div>
              <button
                onClick={() => markAsRead(reminder.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {reminders.length > 3 && (
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {showAll ? 'Show Less' : `Show ${reminders.length - 3} More`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 