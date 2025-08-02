'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, DollarSign, Fuel, Wrench, CheckCircle } from 'lucide-react'

interface Reminder {
  id: string
  type: 'budget' | 'fuel' | 'service'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high'
  icon: React.ReactNode
}

export function SmartReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadReminders = useCallback(async () => {
    try {
      // Get user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('monthly_budget, fuel_capacity, last_service_date, service_interval_days')
        .single()

      // Get current month's fuel records
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false })

      const newReminders: Reminder[] = []

      // Budget warning
      if (settings?.monthly_budget && records) {
        const currentSpent = records.reduce((sum, record) => sum + record.total_cost, 0)
        const budgetPercentage = (currentSpent / settings.monthly_budget) * 100
        
        if (budgetPercentage >= 80 && budgetPercentage < 100) {
          newReminders.push({
            id: 'budget-warning',
            type: 'budget',
            title: 'Budget Warning',
            message: `You've spent ${budgetPercentage.toFixed(0)}% of your monthly fuel budget`,
            severity: 'medium',
            icon: <DollarSign className="h-4 w-4" />
          })
        } else if (budgetPercentage >= 100) {
          newReminders.push({
            id: 'budget-exceeded',
            type: 'budget',
            title: 'Budget Exceeded',
            message: `You've exceeded your monthly budget by ${(budgetPercentage - 100).toFixed(0)}%`,
            severity: 'high',
            icon: <AlertTriangle className="h-4 w-4" />
          })
        }
      }

      // Low fuel reminder
      if (settings?.fuel_capacity && records && records.length > 0) {
        const lastRecord = records[0]
        const estimatedFuelLevel = lastRecord.quantity * 0.3 // Assume 30% remaining
        if (estimatedFuelLevel < (settings.fuel_capacity * 0.2)) {
          newReminders.push({
            id: 'low-fuel',
            type: 'fuel',
            title: 'Low Fuel',
            message: 'Consider refueling soon to avoid running out',
            severity: 'medium',
            icon: <Fuel className="h-4 w-4" />
          })
        }
      }

      // Service reminder
      if (settings?.last_service_date && settings?.service_interval_days) {
        const lastService = new Date(settings.last_service_date)
        const daysSinceService = Math.floor((now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24))
        const daysUntilService = settings.service_interval_days - daysSinceService

        if (daysUntilService <= 7 && daysUntilService > 0) {
          newReminders.push({
            id: 'service-due-soon',
            type: 'service',
            title: 'Service Due Soon',
            message: `Vehicle service due in ${daysUntilService} days`,
            severity: 'medium',
            icon: <Wrench className="h-4 w-4" />
          })
        } else if (daysUntilService <= 0) {
          newReminders.push({
            id: 'service-overdue',
            type: 'service',
            title: 'Service Overdue',
            message: `Vehicle service is ${Math.abs(daysUntilService)} days overdue`,
            severity: 'high',
            icon: <AlertTriangle className="h-4 w-4" />
          })
        }
      }

      setReminders(newReminders)

    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
      default: return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-800 dark:text-red-200'
      case 'medium': return 'text-yellow-800 dark:text-yellow-200'
      case 'low': return 'text-blue-800 dark:text-blue-200'
      default: return 'text-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Smart Reminders
          {reminders.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
              {reminders.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-400 dark:text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              All Good!
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No reminders at the moment. Keep up the good work!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-lg border ${getSeverityColor(reminder.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getSeverityColor(reminder.severity)}`}>
                    {reminder.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${getSeverityTextColor(reminder.severity)}`}>
                      {reminder.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {reminder.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 