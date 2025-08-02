'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Leaf, Tree, Car, TrendingDown, Globe, Target, Award } from 'lucide-react'

interface CarbonData {
  totalCO2: number
  monthlyCO2: number
  averagePerKm: number
  treesNeeded: number
  carbonOffset: number
  environmentalScore: number
  fuelEfficiency: number
  totalDistance: number
  totalFuel: number
}

interface CarbonGoal {
  targetCO2: number
  currentCO2: number
  progress: number
  daysRemaining: number
  isOnTrack: boolean
}

export function CarbonFootprint() {
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null)
  const [carbonGoal, setCarbonGoal] = useState<CarbonGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOffset, setShowOffset] = useState(false)
  const supabase = createClient()

  // CO2 emission factors (kg CO2 per liter)
  const CO2_FACTORS = {
    'Pertalite': 2.31,
    'Pertamax': 2.35,
    'Pertamax Turbo': 2.38,
    'Solar': 2.68,
    'Premium': 2.35,
    'Dexlite': 2.31
  }

  // Average tree absorbs 22kg CO2 per year
  const CO2_PER_TREE_PER_YEAR = 22

  useEffect(() => {
    loadCarbonData()
    loadCarbonGoal()
  }, [])

  const loadCarbonData = async () => {
    try {
      // Get last 12 months of data
      const now = new Date()
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1)
      
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (!records || records.length === 0) {
        setCarbonData({
          totalCO2: 0,
          monthlyCO2: 0,
          averagePerKm: 0,
          treesNeeded: 0,
          carbonOffset: 0,
          environmentalScore: 100,
          fuelEfficiency: 0,
          totalDistance: 0,
          totalFuel: 0
        })
        return
      }

      // Calculate CO2 emissions
      let totalCO2 = 0
      let totalDistance = 0
      let totalFuel = 0

      records.forEach(record => {
        const co2Factor = CO2_FACTORS[record.fuel_type as keyof typeof CO2_FACTORS] || 2.35
        const recordCO2 = record.quantity * co2Factor
        totalCO2 += recordCO2
        totalDistance += record.distance_km
        totalFuel += record.quantity
      })

      // Calculate monthly average
      const monthsDiff = 12
      const monthlyCO2 = totalCO2 / monthsDiff

      // Calculate average CO2 per km
      const averagePerKm = totalDistance > 0 ? totalCO2 / totalDistance : 0

      // Calculate fuel efficiency
      const fuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0

      // Calculate trees needed to offset
      const treesNeeded = Math.ceil(totalCO2 / CO2_PER_TREE_PER_YEAR)

      // Calculate carbon offset cost (assuming $10 per ton CO2)
      const carbonOffset = (totalCO2 / 1000) * 10 // Convert to tons and multiply by $10

      // Calculate environmental score (0-100)
      let environmentalScore = 100
      
      // Deduct points for high CO2 per km
      if (averagePerKm > 0.3) environmentalScore -= 30
      else if (averagePerKm > 0.25) environmentalScore -= 20
      else if (averagePerKm > 0.2) environmentalScore -= 10
      
      // Deduct points for low fuel efficiency
      if (fuelEfficiency < 8) environmentalScore -= 30
      else if (fuelEfficiency < 10) environmentalScore -= 20
      else if (fuelEfficiency < 12) environmentalScore -= 10
      
      // Add points for good efficiency
      if (fuelEfficiency > 15) environmentalScore += 10
      if (averagePerKm < 0.15) environmentalScore += 10

      environmentalScore = Math.max(0, Math.min(100, environmentalScore))

      setCarbonData({
        totalCO2,
        monthlyCO2,
        averagePerKm,
        treesNeeded,
        carbonOffset,
        environmentalScore,
        fuelEfficiency,
        totalDistance,
        totalFuel
      })

    } catch (error) {
      console.error('Error loading carbon data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCarbonGoal = async () => {
    try {
      // Get user's carbon goal from settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('carbon_goal_kg')
        .single()

      if (settings?.carbon_goal_kg) {
        const targetCO2 = settings.carbon_goal_kg
        const currentCO2 = carbonData?.monthlyCO2 || 0
        const progress = Math.min(100, (currentCO2 / targetCO2) * 100)
        const daysRemaining = 30 // Assuming monthly goal
        const isOnTrack = currentCO2 <= targetCO2

        setCarbonGoal({
          targetCO2,
          currentCO2,
          progress,
          daysRemaining,
          isOnTrack
        })
      }
    } catch (error) {
      console.error('Error loading carbon goal:', error)
    }
  }

  const getEnvironmentalGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600 dark:text-green-400', icon: '🌱' }
    if (score >= 80) return { grade: 'A', color: 'text-green-600 dark:text-green-400', icon: '🌿' }
    if (score >= 70) return { grade: 'B', color: 'text-blue-600 dark:text-blue-400', icon: '🌳' }
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600 dark:text-yellow-400', icon: '🍃' }
    if (score >= 50) return { grade: 'D', color: 'text-orange-600 dark:text-orange-400', icon: '🌾' }
    return { grade: 'F', color: 'text-red-600 dark:text-red-400', icon: '🌍' }
  }

  const getOffsetSuggestions = () => {
    const suggestions = []
    
    if (carbonData) {
      if (carbonData.averagePerKm > 0.25) {
        suggestions.push('🚗 Consider carpooling or public transport')
      }
      if (carbonData.fuelEfficiency < 10) {
        suggestions.push('🔧 Maintain your vehicle regularly')
      }
      if (carbonData.treesNeeded > 5) {
        suggestions.push('🌳 Plant trees to offset your carbon footprint')
      }
      if (carbonData.monthlyCO2 > 100) {
        suggestions.push('⚡ Switch to electric or hybrid vehicles')
      }
    }
    
    return suggestions.length > 0 ? suggestions : ['🌱 You\'re doing great! Keep it up!']
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

  if (!carbonData) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Leaf className="h-5 w-5 mr-2" />
            Carbon Footprint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Tidak cukup data untuk menghitung carbon footprint. Tambahkan catatan bahan bakar!
          </p>
        </CardContent>
      </Card>
    )
  }

  const envGrade = getEnvironmentalGrade(carbonData.environmentalScore)
  const offsetSuggestions = getOffsetSuggestions()

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
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">{envGrade.icon}</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {carbonData.environmentalScore.toFixed(0)}
            </span>
            <span className={`text-2xl font-bold ${envGrade.color}`}>
              {envGrade.grade}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Environmental Score
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {carbonData.totalCO2.toFixed(1)} kg
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total CO2 (12 months)
            </p>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {carbonData.monthlyCO2.toFixed(1)} kg
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Monthly Average
            </p>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {(carbonData.averagePerKm * 1000).toFixed(1)} g
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              CO2 per km
            </p>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {carbonData.treesNeeded}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Trees to Offset
            </p>
          </div>
        </div>

        {/* Carbon Goal Progress */}
        {carbonGoal && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Monthly Carbon Goal
              </span>
              <span className={`text-sm font-semibold ${
                carbonGoal.isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {carbonGoal.isOnTrack ? 'On Track' : 'Over Target'}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  carbonGoal.isOnTrack ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(carbonGoal.progress, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{carbonGoal.currentCO2.toFixed(1)} kg</span>
              <span>{carbonGoal.targetCO2.toFixed(1)} kg</span>
            </div>
          </div>
        )}

        {/* Carbon Offset */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Carbon Offset Cost
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              ${carbonData.carbonOffset.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Estimated cost to offset your carbon footprint through certified projects
          </p>
        </div>

        {/* Environmental Impact */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Environmental Impact
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Tree className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {carbonData.treesNeeded} Trees
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Needed to offset your emissions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {carbonData.fuelEfficiency.toFixed(1)} km/L
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Average fuel efficiency
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Suggestions to Reduce Impact
          </h4>
          
          <div className="space-y-2">
            {offsetSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-lg">{suggestion.split(' ')[0]}</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {suggestion.split(' ').slice(1).join(' ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Offset Action */}
        <Button
          onClick={() => setShowOffset(!showOffset)}
          variant="outline"
          className="w-full"
        >
          <Globe className="h-4 w-4 mr-2" />
          Learn About Carbon Offset
        </Button>

        {showOffset && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Carbon Offset Options
            </h5>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>🌳 <strong>Tree Planting:</strong> Plant trees to absorb CO2 naturally</p>
              <p>⚡ <strong>Renewable Energy:</strong> Support solar/wind energy projects</p>
              <p>🏭 <strong>Energy Efficiency:</strong> Fund energy-saving initiatives</p>
              <p>🚗 <strong>Transportation:</strong> Support electric vehicle infrastructure</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 