'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, Car } from 'lucide-react'

interface CarbonData {
  totalCO2: number
  treesNeeded: number
  environmentalScore: number
  monthlyAverage: number
  yearlyProjection: number
}

export function CarbonFootprint() {
  const [carbonData, setCarbonData] = useState<CarbonData>({
    totalCO2: 0,
    treesNeeded: 0,
    environmentalScore: 0,
    monthlyAverage: 0,
    yearlyProjection: 0
  })
  const [carbonGoal, setCarbonGoal] = useState(100)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadCarbonData = useCallback(async () => {
    try {
      const { data: records, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error

      const fuelRecords = records || []
      
      if (fuelRecords.length === 0) {
        setLoading(false)
        return
      }

      // Calculate CO2 emissions based on fuel type
      const co2Emissions = fuelRecords.reduce((total, record) => {
        let emissionFactor = 2.31 // Default for gasoline (kg CO2/L)
        
        switch (record.fuel_type.toLowerCase()) {
          case 'pertalite':
          case 'pertamax':
          case 'pertamax turbo':
            emissionFactor = 2.31 // Gasoline
            break
          case 'solar':
            emissionFactor = 2.68 // Diesel
            break
          default:
            emissionFactor = 2.31 // Default to gasoline
        }
        
        return total + (record.quantity * emissionFactor)
      }, 0)

      // Calculate trees needed to offset (1 tree absorbs ~22kg CO2/year)
      const treesNeeded = Math.ceil(co2Emissions / 22)

      // Calculate environmental score (0-100, lower is better)
      const avgMonthlyCO2 = co2Emissions / Math.max(1, fuelRecords.length / 12)
      const environmentalScore = Math.max(0, 100 - (avgMonthlyCO2 / 50) * 100)

      // Calculate monthly average and yearly projection
      const monthsOfData = Math.max(1, (new Date().getTime() - new Date(fuelRecords[0].date).getTime()) / (1000 * 60 * 60 * 24 * 30))
      const monthlyAverage = co2Emissions / monthsOfData
      const yearlyProjection = monthlyAverage * 12

      setCarbonData({
        totalCO2: co2Emissions,
        treesNeeded,
        environmentalScore,
        monthlyAverage,
        yearlyProjection
      })

    } catch (error) {
      console.error('Error loading carbon data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const loadCarbonGoal = useCallback(async () => {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('carbon_goal_kg')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading carbon goal:', error)
      } else {
        setCarbonGoal(settings?.carbon_goal_kg || 100)
      }
    } catch (error) {
      console.error('Error loading carbon goal:', error)
    }
  }, [supabase])

  useEffect(() => {
    const loadData = async () => {
      await loadCarbonData()
      await loadCarbonGoal()
    }
    loadData()
  }, [loadCarbonData, loadCarbonGoal])

  const getEnvironmentalGrade = (score: number): string => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  const getEnvironmentalColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const goalProgress = carbonGoal > 0 ? (carbonData.yearlyProjection / carbonGoal) * 100 : 0

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
          <Leaf className="h-5 w-5 mr-2" />
          Carbon Footprint
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Environmental Score */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Environmental Score</h4>
            <span className={`text-2xl font-bold ${getEnvironmentalColor(carbonData.environmentalScore)}`}>
              {getEnvironmentalGrade(carbonData.environmentalScore)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                carbonData.environmentalScore >= 80 ? 'bg-green-500' :
                carbonData.environmentalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${carbonData.environmentalScore}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on your fuel consumption patterns
          </p>
        </div>

        {/* CO2 Emissions Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-center mb-2">
              <Car className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-1">Total CO2 Emissions</h5>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {carbonData.totalCO2.toFixed(1)} kg
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              From all fuel purchases
            </p>
          </div>

          <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-center mb-2">
              <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-1">Trees Needed</h5>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {carbonData.treesNeeded}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              To offset emissions
            </p>
          </div>
        </div>

        {/* Monthly and Yearly Projections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Monthly Average</h5>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {carbonData.monthlyAverage.toFixed(1)} kg CO2
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Average monthly emissions
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Yearly Projection</h5>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {carbonData.yearlyProjection.toFixed(1)} kg CO2
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on current usage
            </p>
          </div>
        </div>

        {/* Carbon Goal Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Carbon Goal Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {goalProgress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(goalProgress)}`}
              style={{ width: `${Math.min(goalProgress, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Goal: {carbonGoal} kg CO2/year
          </p>
        </div>

        {/* Environmental Impact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">🌍 Environmental Impact</h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• Your emissions equal driving {Math.round(carbonData.totalCO2 / 0.404)} km in a typical car</p>
            <p>• You would need to plant {carbonData.treesNeeded} trees to offset your emissions</p>
            <p>• This is equivalent to {Math.round(carbonData.totalCO2 / 2.3)} liters of gasoline burned</p>
          </div>
        </div>

        {/* Tips for Reducing Carbon Footprint */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">💡 Tips to Reduce Your Carbon Footprint</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Drive more efficiently - avoid rapid acceleration and braking</li>
            <li>• Maintain proper tire pressure for better fuel economy</li>
            <li>• Consider carpooling or using public transportation</li>
            <li>• Plan routes to avoid traffic and reduce idling</li>
            <li>• Consider switching to a more fuel-efficient vehicle</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 