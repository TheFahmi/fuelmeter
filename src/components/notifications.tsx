'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Settings, CheckCircle, AlertTriangle, Info, X, Clock, Zap } from 'lucide-react'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  action?: {
    label: string
    url: string
  }
}

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

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    budgetAlerts: true,
    serviceReminders: true,
    lowFuelAlerts: true,
    achievementNotifications: true,
    weeklyReports: true,
    priceAlerts: true,
    pushEnabled: false,
    emailEnabled: true
  })
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
    loadSettings()
    checkNotificationPermission()
  }, [])

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setSettings(prev => ({ ...prev, pushEnabled: permission === 'granted' }))
    }
  }

  const loadNotifications = async () => {
    try {
      // Get user's fuel records and settings for smart notifications
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: false })
        .limit(10)

      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .single()

      // Generate smart notifications based on data
      const smartNotifications: Notification[] = []

      if (records && records.length > 0) {
        const latestRecord = records[0]
        const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
        const monthlyBudget = userSettings?.monthly_budget || 0

        // Budget alert
        if (monthlyBudget > 0 && totalCost > monthlyBudget * 0.8) {
          smartNotifications.push({
            id: 'budget-warning',
            type: 'warning',
            title: 'Budget Warning',
            message: `You've spent ${((totalCost / monthlyBudget) * 100).toFixed(0)}% of your monthly fuel budget`,
            timestamp: new Date().toISOString(),
            isRead: false,
            action: {
              label: 'View Budget',
              url: '/dashboard'
            }
          })
        }

        // Low fuel reminder (if no recent fill)
        const daysSinceLastFill = Math.floor((Date.now() - new Date(latestRecord.date).getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceLastFill > 7) {
          smartNotifications.push({
            id: 'low-fuel-reminder',
            type: 'info',
            title: 'Fuel Reminder',
            message: `It's been ${daysSinceLastFill} days since your last fuel fill`,
            timestamp: new Date().toISOString(),
            isRead: false,
            action: {
              label: 'Add Record',
              url: '/dashboard/add-record'
            }
          })
        }

        // Service reminder
        if (userSettings?.last_service_date && userSettings?.service_interval_days) {
          const lastService = new Date(userSettings.last_service_date)
          const daysSinceService = Math.floor((Date.now() - lastService.getTime()) / (1000 * 60 * 60 * 24))
          const daysUntilService = userSettings.service_interval_days - daysSinceService

          if (daysUntilService <= 7 && daysUntilService > 0) {
            smartNotifications.push({
              id: 'service-reminder',
              type: 'warning',
              title: 'Service Due Soon',
              message: `Vehicle service due in ${daysUntilService} days`,
              timestamp: new Date().toISOString(),
              isRead: false,
              action: {
                label: 'View Profile',
                url: '/dashboard/profile'
              }
            })
          } else if (daysUntilService <= 0) {
            smartNotifications.push({
              id: 'service-overdue',
              type: 'error',
              title: 'Service Overdue',
              message: `Vehicle service is ${Math.abs(daysUntilService)} days overdue`,
              timestamp: new Date().toISOString(),
              isRead: false,
              action: {
                label: 'Schedule Service',
                url: '/dashboard/profile'
              }
            })
          }
        }

        // Achievement notification
        if (records.length === 10 || records.length === 50 || records.length === 100) {
          smartNotifications.push({
            id: 'achievement-milestone',
            type: 'success',
            title: 'Achievement Unlocked!',
            message: `Congratulations! You've recorded ${records.length} fuel entries`,
            timestamp: new Date().toISOString(),
            isRead: false,
            action: {
              label: 'View Achievements',
              url: '/dashboard'
            }
          })
        }

        // Price alert (if significant increase)
        if (records.length >= 2) {
          const currentPrice = latestRecord.price_per_liter
          const previousPrice = records[1].price_per_liter
          const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100

          if (priceChange > 10) {
            smartNotifications.push({
              id: 'price-increase',
              type: 'warning',
              title: 'Fuel Price Alert',
              message: `Fuel price increased by ${priceChange.toFixed(1)}% since last fill`,
              timestamp: new Date().toISOString(),
              isRead: false
            })
          }
        }
      }

      // Add some mock notifications for demo
      const mockNotifications: Notification[] = [
        {
          id: 'weekly-report',
          type: 'info',
          title: 'Weekly Report Ready',
          message: 'Your weekly fuel consumption report is now available',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          action: {
            label: 'View Report',
            url: '/dashboard/statistics'
          }
        },
        {
          id: 'efficiency-improvement',
          type: 'success',
          title: 'Efficiency Improved!',
          message: 'Your fuel efficiency has improved by 15% this month',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: false
        }
      ]

      const allNotifications = [...smartNotifications, ...mockNotifications]
      setNotifications(allNotifications)
      setUnreadCount(allNotifications.filter(n => !n.isRead).length)

    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      // In a real app, you'd load settings from database
      // For now, we'll use local state
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
    setUnreadCount(0)
  }

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId)
      return notification && !notification.isRead ? Math.max(0, prev - 1) : prev
    })
  }

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    
    // Save to database in real app
    try {
      // await supabase.from('user_settings').update(newSettings)
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

  const sendTestNotification = async () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FuelMeter Test', {
        body: 'This is a test notification from FuelMeter',
        icon: '/favicon.ico'
      })
    } else {
      alert('Push notifications not enabled. Please enable them in your browser settings.')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      default: return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
      case 'warning': return 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
      case 'error': return 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
      default: return 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
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
        <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
              >
                Mark All Read
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSettings ? (
          /* Settings Panel */
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Notification Settings
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Budget Alerts
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Get notified when approaching budget limits
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.budgetAlerts}
                  onChange={(e) => updateSettings({ budgetAlerts: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Service Reminders
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Remind about vehicle service schedules
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.serviceReminders}
                  onChange={(e) => updateSettings({ serviceReminders: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Low Fuel Alerts
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Remind to add fuel records
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.lowFuelAlerts}
                  onChange={(e) => updateSettings({ lowFuelAlerts: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Achievement Notifications
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Celebrate your achievements
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.achievementNotifications}
                  onChange={(e) => updateSettings({ achievementNotifications: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Weekly Reports
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Get weekly consumption summaries
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.weeklyReports}
                  onChange={(e) => updateSettings({ weeklyReports: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Price Alerts
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Notify about significant price changes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.priceAlerts}
                  onChange={(e) => updateSettings({ priceAlerts: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Push Notifications
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Browser notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushEnabled}
                  onChange={(e) => updateSettings({ pushEnabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>
              
              <Button
                onClick={sendTestNotification}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Test Push Notification
              </Button>
            </div>
          </div>
        ) : (
          /* Notifications List */
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Notifications
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You're all caught up! Check back later for updates.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                    !notification.isRead ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {notification.action && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => window.location.href = notification.action!.url}
                        >
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 