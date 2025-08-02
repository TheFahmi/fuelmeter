'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface BudgetData {
  monthlyBudget: number
  currentSpent: number
  remainingBudget: number
  percentage: number
  daysInMonth: number
  daysRemaining: number
  averageDaily: number
  projectedSpend: number
}

export function BudgetTracker() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadBudgetData()
  }, [])

  const loadBudgetData = async () => {
    try {
      // Get monthly budget from user settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('monthly_budget')
        .single()

      // Handle case where settings don't exist or columns are missing
      const monthlyBudget = settingsError ? 0 : (settings?.monthly_budget || 0)

      // Get current month spending
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const { data: records } = await supabase
        .from('fuel_records')
        .select('total_cost, date')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])

      const currentSpent = records?.reduce((sum, record) => sum + record.total_cost, 0) || 0
      const remainingBudget = monthlyBudget - currentSpent
      const percentage = monthlyBudget > 0 ? (currentSpent / monthlyBudget) * 100 : 0

      const daysInMonth = endOfMonth.getDate()
      const currentDay = now.getDate()
      const daysRemaining = daysInMonth - currentDay

      const averageDaily = currentDay > 0 ? currentSpent / currentDay : 0
      const projectedSpend = averageDaily * daysInMonth

      setBudgetData({
        monthlyBudget,
        currentSpent,
        remainingBudget,
        percentage,
        daysInMonth,
        daysRemaining,
        averageDaily,
        projectedSpend
      })
    } catch (error) {
      console.error('Error loading budget data:', error)
    } finally {
      setLoading(false)
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

  if (!budgetData || budgetData.monthlyBudget === 0) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <DollarSign className="h-5 w-5 mr-2" />
            Budget Bulanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Set budget bulanan di halaman profil untuk melihat tracking
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = () => {
    if (budgetData.percentage <= 50) return 'text-green-600 dark:text-green-400'
    if (budgetData.percentage <= 80) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getProgressColor = () => {
    if (budgetData.percentage <= 50) return 'bg-green-500'
    if (budgetData.percentage <= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const isOverBudget = budgetData.currentSpent > budgetData.monthlyBudget
  const willExceedBudget = budgetData.projectedSpend > budgetData.monthlyBudget

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <DollarSign className="h-5 w-5 mr-2" />
          Budget Bulanan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Terpakai: Rp {budgetData.currentSpent.toLocaleString()}
            </span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {budgetData.percentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(budgetData.percentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Rp 0</span>
            <span>Rp {budgetData.monthlyBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Budget Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Sisa Budget</p>
            <p className={`font-semibold ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {isOverBudget ? '-' : ''}Rp {Math.abs(budgetData.remainingBudget).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Rata-rata Harian</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              Rp {budgetData.averageDaily.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Warnings */}
        {willExceedBudget && !isOverBudget && (
          <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Peringatan Budget
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Proyeksi pengeluaran: Rp {budgetData.projectedSpend.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {isOverBudget && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Budget Terlampaui!
              </p>
              <p className="text-xs text-red-700 dark:text-red-400">
                Anda sudah melebihi budget bulanan sebesar Rp {(budgetData.currentSpent - budgetData.monthlyBudget).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Days Remaining */}
        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {budgetData.daysRemaining} hari tersisa di bulan ini
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 