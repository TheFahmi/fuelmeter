'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, AlertTriangle, CheckCircle, Target } from 'lucide-react'

interface FuelRecord {
  id: string
  date: string
  fuel_type: string
  quantity: number
  price_per_liter: number
  total_cost: number
  distance_km: number
  odometer_km: number
  station: string
  created_at: string
}

export function BudgetTracker() {
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [currentSpent, setCurrentSpent] = useState(0)
  const [remainingBudget, setRemainingBudget] = useState(0)
  const [percentage, setPercentage] = useState(0)
  const [averageDaily, setAverageDaily] = useState(0)
  const [projectedSpend, setProjectedSpend] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadBudgetData = useCallback(async () => {
    try {
      // Get current month's start and end dates
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Get monthly budget from user settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('monthly_budget')
        .single()

      // Handle case where settings don't exist or columns are missing
      const budget = settingsError ? 0 : (settings?.monthly_budget || 0)
      setMonthlyBudget(budget)

      // Get fuel records for current month
      const { data: records, error: recordsError } = await supabase
        .from('fuel_records')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])

      if (recordsError) throw recordsError

      const fuelRecords = records || []
      const spent = fuelRecords.reduce((sum, record) => sum + record.total_cost, 0)
      setCurrentSpent(spent)

      const remaining = Math.max(0, budget - spent)
      setRemainingBudget(remaining)

      const percent = budget > 0 ? (spent / budget) * 100 : 0
      setPercentage(percent)

      // Calculate average daily spending
      const daysInMonth = endOfMonth.getDate()
      const daysElapsed = now.getDate()
      const avgDaily = daysElapsed > 0 ? spent / daysElapsed : 0
      setAverageDaily(avgDaily)

      // Project total spending for the month
      const projected = avgDaily * daysInMonth
      setProjectedSpend(projected)

    } catch (error) {
      console.error('Error loading budget data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadBudgetData()
  }, [loadBudgetData])

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusIcon = (percent: number) => {
    if (percent >= 90) return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
    if (percent >= 75) return <Target className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
    return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
  }

  const getStatusText = (percent: number) => {
    if (percent >= 90) return 'Budget Exceeded!'
    if (percent >= 75) return 'Budget Warning'
    return 'On Track'
  }

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 dark:text-red-400'
    if (percent >= 75) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
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
          <DollarSign className="h-5 w-5 mr-2" />
          Monthly Budget Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Budget Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {getStatusIcon(percentage)}
          <span className={`font-medium ${getStatusColor(percentage)}`}>
            {getStatusText(percentage)}
          </span>
        </div>

        {/* Budget Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              Rp {monthlyBudget.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Monthly Budget</p>
          </div>

          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              Rp {currentSpent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Spent This Month</p>
          </div>

          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className={`text-2xl font-bold ${getStatusColor(percentage)}`}>
              Rp {remainingBudget.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
          </div>

          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              Rp {averageDaily.toFixed(0)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Daily</p>
          </div>
        </div>

        {/* Projection */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Projected Monthly Spend
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Rp {projectedSpend.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Based on current daily average
          </p>
        </div>

        {/* Warnings */}
        {percentage >= 90 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Budget Exceeded!
              </span>
            </div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              You have exceeded your monthly budget. Consider reducing fuel consumption.
            </p>
          </div>
        )}

        {percentage >= 75 && percentage < 90 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Budget Warning
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              You&apos;re approaching your monthly budget limit. Monitor your spending.
            </p>
          </div>
        )}

        {percentage < 75 && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                On Track
              </span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Great! You&apos;re well within your monthly budget.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 