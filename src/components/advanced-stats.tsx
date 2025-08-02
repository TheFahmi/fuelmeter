'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Target, Zap, Calendar, DollarSign } from 'lucide-react'

interface AdvancedStats {
  efficiencyScore: string
  efficiencyGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  monthlyTrend: number
  costPrediction: number
  bestFillTime: string
  averageCostPerKm: number
  totalDistance: number
  totalCost: number
  fuelEfficiency: number // km/L
}

export function AdvancedStats() {
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAdvancedStats()
  }, [])

  const loadAdvancedStats = async () => {
    try {
      // Get last 6 months of data
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (!records || records.length === 0) {
        setStats(null)
        return
      }

      // Calculate basic stats
      const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
      const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
      const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0)
      const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
      const fuelEfficiency = totalQuantity > 0 ? totalDistance / totalQuantity : 0

      // Calculate efficiency score (0-100)
      let efficiencyScore = 100
      
      // Deduct points for high cost per km
      if (averageCostPerKm > 2000) efficiencyScore -= 30
      else if (averageCostPerKm > 1500) efficiencyScore -= 20
      else if (averageCostPerKm > 1000) efficiencyScore -= 10
      
      // Deduct points for low fuel efficiency
      if (fuelEfficiency < 8) efficiencyScore -= 30
      else if (fuelEfficiency < 10) efficiencyScore -= 20
      else if (fuelEfficiency < 12) efficiencyScore -= 10
      
      // Add points for good efficiency
      if (fuelEfficiency > 15) efficiencyScore += 10
      if (averageCostPerKm < 800) efficiencyScore += 10

      efficiencyScore = Math.max(0, Math.min(100, efficiencyScore))

      // Calculate efficiency grade
      const getEfficiencyGrade = (score: number): AdvancedStats['efficiencyGrade'] => {
        if (score >= 95) return 'A+'
        if (score >= 90) return 'A'
        if (score >= 85) return 'B+'
        if (score >= 80) return 'B'
        if (score >= 75) return 'C+'
        if (score >= 70) return 'C'
        if (score >= 60) return 'D'
        return 'F'
      }

      // Calculate monthly trend
      const currentMonth = now.getMonth()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const currentYear = now.getFullYear()
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

      const currentMonthRecords = records.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
      })

      const lastMonthRecords = records.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === lastMonthYear
      })

      const currentMonthCost = currentMonthRecords.reduce((sum, record) => sum + record.total_cost, 0)
      const lastMonthCost = lastMonthRecords.reduce((sum, record) => sum + record.total_cost, 0)
      
      const monthlyTrend = lastMonthCost > 0 ? ((currentMonthCost - lastMonthCost) / lastMonthCost) * 100 : 0

      // Cost prediction for next month
      const averageMonthlyCost = totalCost / 6
      const trendFactor = 1 + (monthlyTrend / 100)
      const costPrediction = averageMonthlyCost * trendFactor

      // Best fill time (based on price patterns)
      const priceByHour: { [key: number]: number[] } = {}
      records.forEach(record => {
        const hour = new Date(record.created_at).getHours()
        if (!priceByHour[hour]) priceByHour[hour] = []
        priceByHour[hour].push(record.price_per_liter)
      })

      let bestHour = 8 // Default to morning
      let lowestAvgPrice = Infinity
      
      Object.entries(priceByHour).forEach(([hour, prices]) => {
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
        if (avgPrice < lowestAvgPrice) {
          lowestAvgPrice = avgPrice
          bestHour = parseInt(hour)
        }
      })

      const getBestFillTime = (hour: number) => {
        if (hour < 12) return `${hour}:00 Pagi`
        if (hour < 18) return `${hour}:00 Siang`
        return `${hour}:00 Malam`
      }

      setStats({
        efficiencyScore: efficiencyScore.toFixed(1),
        efficiencyGrade: getEfficiencyGrade(efficiencyScore),
        monthlyTrend,
        costPrediction,
        bestFillTime: getBestFillTime(bestHour),
        averageCostPerKm,
        totalDistance,
        totalCost,
        fuelEfficiency
      })

    } catch (error) {
      console.error('Error loading advanced stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEfficiencyColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 dark:text-green-400'
      case 'B+':
      case 'B': return 'text-blue-600 dark:text-blue-400'
      case 'C+':
      case 'C': return 'text-yellow-600 dark:text-yellow-400'
      case 'D': return 'text-orange-600 dark:text-orange-400'
      case 'F': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Target className="h-4 w-4 text-gray-500" />
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

  if (!stats) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Zap className="h-5 w-5 mr-2" />
            Advanced Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Tidak cukup data untuk menampilkan statistik lanjutan. Tambahkan lebih banyak catatan!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <Zap className="h-5 w-5 mr-2" />
          Advanced Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Efficiency Score */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.efficiencyScore}
            </span>
            <span className={`text-2xl font-bold ${getEfficiencyColor(stats.efficiencyGrade)}`}>
              {stats.efficiencyGrade}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Efficiency Score
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.fuelEfficiency.toFixed(1)} km/L
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Fuel Efficiency
            </p>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Rp {stats.averageCostPerKm.toFixed(0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Cost per km
            </p>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            {getTrendIcon(stats.monthlyTrend)}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Monthly Trend
            </span>
          </div>
          <span className={`text-sm font-semibold ${
            stats.monthlyTrend > 0 ? 'text-red-600 dark:text-red-400' : 
            stats.monthlyTrend < 0 ? 'text-green-600 dark:text-green-400' : 
            'text-gray-600 dark:text-gray-400'
          }`}>
            {stats.monthlyTrend > 0 ? '+' : ''}{stats.monthlyTrend.toFixed(1)}%
          </span>
        </div>

        {/* Cost Prediction */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Next Month Prediction
            </span>
          </div>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Rp {stats.costPrediction.toLocaleString()}
          </span>
        </div>

        {/* Best Fill Time */}
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Best Fill Time
            </span>
          </div>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {stats.bestFillTime}
          </span>
        </div>

        {/* Tips */}
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>💡 <strong>Tips:</strong> Isi BBM di {stats.bestFillTime} untuk harga terbaik</p>
          {stats.efficiencyGrade === 'F' && (
            <p>⚠️ <strong>Warning:</strong> Efisiensi bahan bakar Anda rendah. Cek tekanan ban dan servis berkala!</p>
          )}
          {stats.monthlyTrend > 10 && (
            <p>📈 <strong>Trend:</strong> Pengeluaran meningkat. Pertimbangkan untuk menghemat!</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 