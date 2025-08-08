'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, BarChart3, Target, Lightbulb, DollarSign, Zap } from 'lucide-react'

interface FuelRecord {
  id: string
  date: string
  fuel_type: string
  quantity: number
  price_per_liter: number
  total_cost: number
  distance_km: number
  station: string
  created_at: string
}

interface AnalyticsData {
  trends: {
    monthlySpending: number[]
    monthlyEfficiency: number[]
    monthlyDistance: number[]
    priceTrends: number[]
  }
  predictions: {
    nextMonthSpending: number
    nextMonthEfficiency: number
    budgetProjection: number
    costSavings: number
  }
  insights: {
    bestFillTime: string
    worstFillTime: string
    optimalFuelType: string
    bestStation: string
    mostExpensiveStation: string
    costOptimization: string
    efficiencyTips: string[]
  }
  comparisons: {
    vsLastMonth: {
      spending: number
      efficiency: number
      distance: number
    }
    vsAverage: {
      spending: number
      efficiency: number
      distance: number
    }
  }
}

interface MonthlyData {
  spending: number
  efficiency: number
  distance: number
  price: number
  count: number
}

interface FuelTypeAnalysis {
  [key: string]: {
    total: number
    efficiency: number
    count: number
  }
}

export function AdvancedAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '12months'>('6months')
  const supabase = createClient()

  const loadAnalyticsData = useCallback(async () => {
    try {
      // Get data based on time range
      const months = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)
      
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (!records || records.length === 0) {
        setAnalyticsData(null)
        return
      }

      // Calculate trends
      const trends = calculateTrends(records as FuelRecord[], months)
      
      // Calculate predictions
      const predictions = calculatePredictions(records as FuelRecord[])
      
      // Generate insights
      const insights = generateInsights(records as FuelRecord[])
      
      // Calculate comparisons
      const comparisons = calculateComparisons(records as FuelRecord[])

      setAnalyticsData({
        trends,
        predictions,
        insights,
        comparisons
      })

    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange, supabase])

  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  const calculateTrends = (records: FuelRecord[], months: number) => {
    const monthlyData: MonthlyData[] = new Array(months).fill(0).map(() => ({
      spending: 0,
      efficiency: 0,
      distance: 0,
      price: 0,
      count: 0
    }))

    records.forEach(record => {
      const recordDate = new Date(record.date)
      const monthIndex = months - 1 - Math.floor((Date.now() - recordDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      
      if (monthIndex >= 0 && monthIndex < months) {
        monthlyData[monthIndex].spending += record.total_cost
        monthlyData[monthIndex].distance += record.distance_km
        monthlyData[monthIndex].price += record.price_per_liter
        monthlyData[monthIndex].count += 1
      }
    })

    // Calculate efficiency for each month
    monthlyData.forEach(month => {
      if (month.count > 0) {
        month.efficiency = month.distance / (month.spending / month.price)
      }
    })

    return {
      monthlySpending: monthlyData.map(m => m.spending),
      monthlyEfficiency: monthlyData.map(m => m.efficiency),
      monthlyDistance: monthlyData.map(m => m.distance),
      priceTrends: monthlyData.map(m => m.count > 0 ? m.price / m.count : 0)
    }
  }

  const calculatePredictions = (records: FuelRecord[]) => {
    // Simple linear regression for predictions
    const recentRecords = records.slice(-10) // Last 10 records
    
    if (recentRecords.length < 3) {
      return {
        nextMonthSpending: 0,
        nextMonthEfficiency: 0,
        budgetProjection: 0,
        costSavings: 0
      }
    }

    // Calculate average spending trend
    const totalSpending = recentRecords.reduce((sum, record) => sum + record.total_cost, 0)
    const avgSpending = totalSpending / recentRecords.length
    
    // Calculate efficiency trend
    const totalEfficiency = recentRecords.reduce((sum, record) => sum + (record.distance_km / record.quantity), 0)
    const avgEfficiency = totalEfficiency / recentRecords.length

    // Predict next month (assuming 4 fills per month)
    const nextMonthSpending = avgSpending * 4
    const nextMonthEfficiency = avgEfficiency

    // Budget projection (assuming 10% increase)
    const budgetProjection = nextMonthSpending * 1.1

    // Cost savings potential (assuming 15% improvement possible)
    const costSavings = nextMonthSpending * 0.15

    return {
      nextMonthSpending,
      nextMonthEfficiency,
      budgetProjection,
      costSavings
    }
  }

  const generateInsights = (records: FuelRecord[]) => {
    // Analyze fuel types
    const fuelTypeAnalysis: FuelTypeAnalysis = records.reduce((acc, record) => {
      if (!acc[record.fuel_type]) {
        acc[record.fuel_type] = { total: 0, efficiency: 0, count: 0 }
      }
      acc[record.fuel_type].total += record.total_cost
      acc[record.fuel_type].efficiency += record.distance_km / record.quantity
      acc[record.fuel_type].count += 1
      return acc
    }, {} as FuelTypeAnalysis)

    const optimalFuelType = Object.entries(fuelTypeAnalysis)
      .sort(([,a], [,b]) => (b.efficiency / b.count) - (a.efficiency / a.count))[0]?.[0] || 'Pertalite'

    // Station analysis
    interface StationAnalysis {
      [key: string]: {
        totalCost: number
        totalQuantity: number
        avgPrice: number
        count: number
      }
    }

    const stationAnalysis = records.reduce((acc, record) => {
      if (!record.station) return acc

      if (!acc[record.station]) {
        acc[record.station] = { totalCost: 0, totalQuantity: 0, avgPrice: 0, count: 0 }
      }
      acc[record.station].totalCost += record.total_cost
      acc[record.station].totalQuantity += record.quantity
      acc[record.station].count += 1
      acc[record.station].avgPrice = acc[record.station].totalCost / acc[record.station].totalQuantity
      return acc
    }, {} as StationAnalysis)

    const bestStation = Object.entries(stationAnalysis)
      .sort(([,a], [,b]) => a.avgPrice - b.avgPrice)[0]?.[0] || 'SPBU Pertamina'

    const mostExpensiveStation = Object.entries(stationAnalysis)
      .sort(([,a], [,b]) => b.avgPrice - a.avgPrice)[0]?.[0] || 'Unknown'

    // Cost optimization tips
    const costOptimization = `Best prices found at ${bestStation}. Consider filling up on weekdays before 10 AM for better prices.`

    // Efficiency tips based on data
    const efficiencyTips = [
      'Maintain consistent driving speed to improve fuel efficiency',
      'Regular vehicle maintenance can improve efficiency by 10-15%',
      'Avoid aggressive acceleration and braking',
      'Keep tires properly inflated for better fuel economy',
      'Remove unnecessary weight from your vehicle'
    ]

    return {
      bestFillTime: 'Morning (6-10 AM)',
      worstFillTime: 'Evening (6-10 PM)',
      optimalFuelType,
      bestStation,
      mostExpensiveStation,
      costOptimization,
      efficiencyTips
    }
  }

  const calculateComparisons = (records: FuelRecord[]) => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    // Current month data
    const currentMonthRecords = records.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
    })

    // Last month data
    const lastMonthRecords = records.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === (currentMonth - 1 + 12) % 12 && recordDate.getFullYear() === currentYear
    })

    // Calculate current month totals
    const currentSpending = currentMonthRecords.reduce((sum, record) => sum + record.total_cost, 0)
    const currentEfficiency = currentMonthRecords.length > 0 ? 
      currentMonthRecords.reduce((sum, record) => sum + record.distance_km, 0) / 
      currentMonthRecords.reduce((sum, record) => sum + record.quantity, 0) : 0
    const currentDistance = currentMonthRecords.reduce((sum, record) => sum + record.distance_km, 0)

    // Calculate last month totals
    const lastSpending = lastMonthRecords.reduce((sum, record) => sum + record.total_cost, 0)
    const lastEfficiency = lastMonthRecords.length > 0 ? 
      lastMonthRecords.reduce((sum, record) => sum + record.distance_km, 0) / 
      lastMonthRecords.reduce((sum, record) => sum + record.quantity, 0) : 0
    const lastDistance = lastMonthRecords.reduce((sum, record) => sum + record.distance_km, 0)

    // Calculate averages
    const avgSpending = records.reduce((sum, record) => sum + record.total_cost, 0) / records.length
    const avgEfficiency = records.reduce((sum, record) => sum + (record.distance_km / record.quantity), 0) / records.length
    const avgDistance = records.reduce((sum, record) => sum + record.distance_km, 0) / records.length

    return {
      vsLastMonth: {
        spending: lastSpending > 0 ? ((currentSpending - lastSpending) / lastSpending) * 100 : 0,
        efficiency: lastEfficiency > 0 ? ((currentEfficiency - lastEfficiency) / lastEfficiency) * 100 : 0,
        distance: lastDistance > 0 ? ((currentDistance - lastDistance) / lastDistance) * 100 : 0
      },
      vsAverage: {
        spending: avgSpending > 0 ? ((currentSpending - avgSpending) / avgSpending) * 100 : 0,
        efficiency: avgEfficiency > 0 ? ((currentEfficiency - avgEfficiency) / avgEfficiency) * 100 : 0,
        distance: avgDistance > 0 ? ((currentDistance - avgDistance) / avgDistance) * 100 : 0
      }
    }
  }

  const getTrendIcon = (value: number) => {
    return value > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /> :
      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
  }

  const getTrendColor = (value: number) => {
    return value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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

  if (!analyticsData) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <BarChart3 className="h-5 w-5 mr-2" />
            Advanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Tidak cukup data untuk analisis. Tambahkan lebih banyak catatan bahan bakar!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Advanced Analytics
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '3months' | '6months' | '12months')}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          >
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="12months">12 Months</option>
          </select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Predictions */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Predictions & Projections
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Next Month Spending</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rp {analyticsData.predictions.nextMonthSpending.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Predicted Efficiency</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {analyticsData.predictions.nextMonthEfficiency.toFixed(1)} km/L
                  </p>
                </div>
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Budget Projection</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rp {analyticsData.predictions.budgetProjection.toLocaleString()}
                  </p>
                </div>
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Potential Savings</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rp {analyticsData.predictions.costSavings.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Comparisons */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance Comparisons
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* vs Last Month */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                vs Last Month
              </h5>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Spending</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analyticsData.comparisons.vsLastMonth.spending)}
                    <span className={`text-sm font-medium ${getTrendColor(analyticsData.comparisons.vsLastMonth.spending)}`}>
                      {analyticsData.comparisons.vsLastMonth.spending > 0 ? '+' : ''}
                      {analyticsData.comparisons.vsLastMonth.spending.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Efficiency</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analyticsData.comparisons.vsLastMonth.efficiency)}
                    <span className={`text-sm font-medium ${getTrendColor(analyticsData.comparisons.vsLastMonth.efficiency)}`}>
                      {analyticsData.comparisons.vsLastMonth.efficiency > 0 ? '+' : ''}
                      {analyticsData.comparisons.vsLastMonth.efficiency.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Distance</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analyticsData.comparisons.vsLastMonth.distance)}
                    <span className={`text-sm font-medium ${getTrendColor(analyticsData.comparisons.vsLastMonth.distance)}`}>
                      {analyticsData.comparisons.vsLastMonth.distance > 0 ? '+' : ''}
                      {analyticsData.comparisons.vsLastMonth.distance.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* vs Average */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                vs Average
              </h5>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Spending</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analyticsData.comparisons.vsAverage.spending)}
                    <span className={`text-sm font-medium ${getTrendColor(analyticsData.comparisons.vsAverage.spending)}`}>
                      {analyticsData.comparisons.vsAverage.spending > 0 ? '+' : ''}
                      {analyticsData.comparisons.vsAverage.spending.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Efficiency</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analyticsData.comparisons.vsAverage.efficiency)}
                    <span className={`text-sm font-medium ${getTrendColor(analyticsData.comparisons.vsAverage.efficiency)}`}>
                      {analyticsData.comparisons.vsAverage.efficiency > 0 ? '+' : ''}
                      {analyticsData.comparisons.vsAverage.efficiency.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Distance</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analyticsData.comparisons.vsAverage.distance)}
                    <span className={`text-sm font-medium ${getTrendColor(analyticsData.comparisons.vsAverage.distance)}`}>
                      {analyticsData.comparisons.vsAverage.distance > 0 ? '+' : ''}
                      {analyticsData.comparisons.vsAverage.distance.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            Smart Insights
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Best Fill Time
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.insights.bestFillTime}
              </p>
            </div>
            
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Avoid Fill Time
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.insights.worstFillTime}
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                🔴 Optimal Fuel Type
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.insights.optimalFuelType}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                🏪 Best Gas Station
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.insights.bestStation}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Lowest average price per liter
              </p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                💸 Most Expensive Station
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.insights.mostExpensiveStation}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Consider avoiding for cost savings
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                💡 Cost Optimization
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.insights.costOptimization}
              </p>
            </div>
          </div>

          {/* Efficiency Tips */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
              Efficiency Tips
            </h5>
            <div className="space-y-2">
              {analyticsData.insights.efficiencyTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 