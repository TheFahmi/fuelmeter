'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, BarChart3, Clock, DollarSign } from 'lucide-react'

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

interface MonthlyData {
  month: string
  totalCost: number
  totalQuantity: number
  totalDistance: number
  recordCount: number
}

interface FuelTypeAnalysis {
  type: string
  totalCost: number
  totalQuantity: number
  averagePrice: number
  usageCount: number
}

export function AdvancedStats() {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [efficiencyScore, setEfficiencyScore] = useState(0)
  const [fuelEfficiency, setFuelEfficiency] = useState(0)
  const [monthlyTrend, setMonthlyTrend] = useState<'increasing' | 'decreasing' | 'stable'>('stable')
  const [costPrediction, setCostPrediction] = useState(0)
  const [bestFillTime, setBestFillTime] = useState('')
  const supabase = createClient()

  const loadAdvancedStats = useCallback(async () => {
    try {
      const { data: records, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error

      const fuelRecords = records || []
      setFuelRecords(fuelRecords)

      if (fuelRecords.length === 0) {
        setLoading(false)
        return
      }

      // Calculate fuel efficiency
      const totalDistance = fuelRecords.reduce((sum, record) => sum + record.distance_km, 0)
      const totalQuantity = fuelRecords.reduce((sum, record) => sum + record.quantity, 0)
      const efficiency = totalQuantity > 0 ? totalDistance / totalQuantity : 0
      setFuelEfficiency(efficiency)

      // Calculate efficiency score (0-100)
      const maxEfficiency = 25 // km/L
      const score = Math.min(100, (efficiency / maxEfficiency) * 100)
      setEfficiencyScore(score)

      // Analyze monthly trend
      const monthlyData = getMonthlyData(fuelRecords)
      if (monthlyData.length >= 2) {
        const recent = monthlyData[monthlyData.length - 1]
        const previous = monthlyData[monthlyData.length - 2]
        const trend = recent.totalCost > previous.totalCost ? 'increasing' : 
                     recent.totalCost < previous.totalCost ? 'decreasing' : 'stable'
        setMonthlyTrend(trend)
      }

      // Predict next month cost
      const avgMonthlyCost = monthlyData.length > 0 
        ? monthlyData.reduce((sum, month) => sum + month.totalCost, 0) / monthlyData.length
        : 0
      setCostPrediction(avgMonthlyCost)

      // Find best fill time (simplified - could be enhanced with more data)
      const fillTimes = fuelRecords.map(record => new Date(record.created_at).getHours())
      const timeCounts: { [key: number]: number } = {}
      fillTimes.forEach(hour => {
        timeCounts[hour] = (timeCounts[hour] || 0) + 1
      })
      const bestHour = Object.keys(timeCounts).reduce((a, b) => 
        timeCounts[parseInt(a)] > timeCounts[parseInt(b)] ? a : b, '0')
      setBestFillTime(`${bestHour}:00`)

    } catch (error) {
      console.error('Error loading advanced stats:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadAdvancedStats()
  }, [loadAdvancedStats])

  const getMonthlyData = (records: FuelRecord[]): MonthlyData[] => {
    const monthlyData: { [key: string]: MonthlyData } = {}

    records.forEach(record => {
      const month = new Date(record.date).toISOString().slice(0, 7) // YYYY-MM format
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          totalCost: 0,
          totalQuantity: 0,
          totalDistance: 0,
          recordCount: 0
        }
      }

      monthlyData[month].totalCost += record.total_cost
      monthlyData[month].totalQuantity += record.quantity
      monthlyData[month].totalDistance += record.distance_km
      monthlyData[month].recordCount += 1
    })

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
  }

  const getFuelTypeAnalysis = (): FuelTypeAnalysis[] => {
    const analysis: { [key: string]: FuelTypeAnalysis } = {}

    fuelRecords.forEach(record => {
      if (!analysis[record.fuel_type]) {
        analysis[record.fuel_type] = {
          type: record.fuel_type,
          totalCost: 0,
          totalQuantity: 0,
          averagePrice: 0,
          usageCount: 0
        }
      }

      analysis[record.fuel_type].totalCost += record.total_cost
      analysis[record.fuel_type].totalQuantity += record.quantity
      analysis[record.fuel_type].usageCount += 1
    })

    // Calculate average prices
    Object.values(analysis).forEach(type => {
      type.averagePrice = type.totalQuantity > 0 ? type.totalCost / type.totalQuantity : 0
    })

    return Object.values(analysis).sort((a, b) => b.totalCost - a.totalCost)
  }

  const getEfficiencyGrade = (score: number): string => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  const getEfficiencyColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
      case 'decreasing': return <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
      default: return <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    }
  }

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'Costs are increasing'
      case 'decreasing': return 'Costs are decreasing'
      default: return 'Costs are stable'
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

  const fuelTypeAnalysis = getFuelTypeAnalysis()

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <BarChart3 className="h-5 w-5 mr-2" />
          Advanced Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Efficiency Score */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Efficiency Score</h4>
            <span className={`text-2xl font-bold ${getEfficiencyColor(efficiencyScore)}`}>
              {getEfficiencyGrade(efficiencyScore)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                efficiencyScore >= 80 ? 'bg-green-500' :
                efficiencyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${efficiencyScore}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {fuelEfficiency.toFixed(1)} km/L average efficiency
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-center mb-2">
              {getTrendIcon(monthlyTrend)}
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-1">Monthly Trend</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getTrendText(monthlyTrend)}
            </p>
          </div>

          <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-1">Next Month Prediction</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rp {costPrediction.toLocaleString()}
            </p>
          </div>

          <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-center mb-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-1">Best Fill Time</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {bestFillTime}
            </p>
          </div>
        </div>

        {/* Fuel Type Analysis */}
        {fuelTypeAnalysis.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Fuel Type Analysis</h4>
            <div className="space-y-2">
              {fuelTypeAnalysis.map((type) => (
                <div key={type.type} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <h6 className="font-medium text-gray-900 dark:text-white">{type.type}</h6>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {type.usageCount} times used
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Rp {type.totalCost.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Rp {type.averagePrice.toFixed(0)}/L avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">💡 Tips for Better Efficiency</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Maintain proper tire pressure</li>
            <li>• Avoid aggressive acceleration and braking</li>
            <li>• Keep your vehicle well-maintained</li>
            <li>• Use air conditioning efficiently</li>
            <li>• Plan routes to avoid traffic</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 