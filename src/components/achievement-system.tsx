'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, CheckCircle } from 'lucide-react'

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

interface Achievement {
  id: string
  title: string
  description: string
  category: string
  requirement: number
  currentProgress: number
  isCompleted: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  icon: string
}

interface UserStats {
  totalRecords: number
  totalCost: number
  totalDistance: number
  averageEfficiency: number
  consecutiveDays: number
  monthlyRecords: number
}

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalRecords: 0,
    totalCost: 0,
    totalDistance: 0,
    averageEfficiency: 0,
    consecutiveDays: 0,
    monthlyRecords: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadAchievements = useCallback(async () => {
    try {
      // Fetch user's fuel records
      const { data: records, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error

      const fuelRecords = records || []
      
      // Calculate user stats
      const totalRecords = fuelRecords.length
      const totalCost = fuelRecords.reduce((sum, record) => sum + record.total_cost, 0)
      const totalDistance = fuelRecords.reduce((sum, record) => sum + record.distance_km, 0)
      const averageEfficiency = totalDistance > 0 ? totalDistance / fuelRecords.reduce((sum, record) => sum + record.quantity, 0) : 0
      const consecutiveDays = calculateConsecutiveDays(fuelRecords)
      
      // Calculate monthly records
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRecords = fuelRecords.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
      }).length

      const stats: UserStats = {
        totalRecords,
        totalCost,
        totalDistance,
        averageEfficiency,
        consecutiveDays,
        monthlyRecords
      }

      setUserStats(stats)

      // Define achievements
      const achievementList: Achievement[] = [
        // Milestone Achievements
        {
          id: 'first_record',
          title: 'First Steps',
          description: 'Record your first fuel purchase',
          category: 'milestone',
          requirement: 1,
          currentProgress: totalRecords,
          isCompleted: totalRecords >= 1,
          rarity: 'common',
          icon: '🎯'
        },
        {
          id: 'ten_records',
          title: 'Getting Started',
          description: 'Record 10 fuel purchases',
          category: 'milestone',
          requirement: 10,
          currentProgress: totalRecords,
          isCompleted: totalRecords >= 10,
          rarity: 'common',
          icon: '📊'
        },
        {
          id: 'fifty_records',
          title: 'Dedicated Tracker',
          description: 'Record 50 fuel purchases',
          category: 'milestone',
          requirement: 50,
          currentProgress: totalRecords,
          isCompleted: totalRecords >= 50,
          rarity: 'rare',
          icon: '🏆'
        },
        {
          id: 'hundred_records',
          title: 'Century Club',
          description: 'Record 100 fuel purchases',
          category: 'milestone',
          requirement: 100,
          currentProgress: totalRecords,
          isCompleted: totalRecords >= 100,
          rarity: 'epic',
          icon: '👑'
        },

        // Efficiency Achievements
        {
          id: 'efficient_driver',
          title: 'Efficient Driver',
          description: 'Achieve 15+ km/L average efficiency',
          category: 'efficiency',
          requirement: 15,
          currentProgress: averageEfficiency,
          isCompleted: averageEfficiency >= 15,
          rarity: 'rare',
          icon: '⚡'
        },
        {
          id: 'eco_warrior',
          title: 'Eco Warrior',
          description: 'Achieve 20+ km/L average efficiency',
          category: 'efficiency',
          requirement: 20,
          currentProgress: averageEfficiency,
          isCompleted: averageEfficiency >= 20,
          rarity: 'epic',
          icon: '🌱'
        },
        {
          id: 'hypermiler',
          title: 'Hypermiler',
          description: 'Achieve 25+ km/L average efficiency',
          category: 'efficiency',
          requirement: 25,
          currentProgress: averageEfficiency,
          isCompleted: averageEfficiency >= 25,
          rarity: 'legendary',
          icon: '🚀'
        },

        // Consistency Achievements
        {
          id: 'week_warrior',
          title: 'Week Warrior',
          description: 'Record fuel purchases for 7 consecutive days',
          category: 'consistency',
          requirement: 7,
          currentProgress: consecutiveDays,
          isCompleted: consecutiveDays >= 7,
          rarity: 'rare',
          icon: '📅'
        },
        {
          id: 'month_master',
          title: 'Month Master',
          description: 'Record fuel purchases for 30 consecutive days',
          category: 'consistency',
          requirement: 30,
          currentProgress: consecutiveDays,
          isCompleted: consecutiveDays >= 30,
          rarity: 'epic',
          icon: '📆'
        },
        {
          id: 'streak_legend',
          title: 'Streak Legend',
          description: 'Record fuel purchases for 100 consecutive days',
          category: 'consistency',
          requirement: 100,
          currentProgress: consecutiveDays,
          isCompleted: consecutiveDays >= 100,
          rarity: 'legendary',
          icon: '🔥'
        },

        // Savings Achievements
        {
          id: 'budget_conscious',
          title: 'Budget Conscious',
          description: 'Track spending of Rp 1,000,000+',
          category: 'savings',
          requirement: 1000000,
          currentProgress: totalCost,
          isCompleted: totalCost >= 1000000,
          rarity: 'common',
          icon: '💰'
        },
        {
          id: 'big_spender',
          title: 'Big Spender',
          description: 'Track spending of Rp 5,000,000+',
          category: 'savings',
          requirement: 5000000,
          currentProgress: totalCost,
          isCompleted: totalCost >= 5000000,
          rarity: 'rare',
          icon: '💎'
        }
      ]

      setAchievements(achievementList)
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  const calculateConsecutiveDays = (records: FuelRecord[]): number => {
    if (records.length === 0) return 0

    const sortedRecords = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let maxStreak = 0
    let currentStreak = 1

    for (let i = 1; i < sortedRecords.length; i++) {
      const prevDate = new Date(sortedRecords[i - 1].date)
      const currDate = new Date(sortedRecords[i].date)
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentStreak++
      } else {
        maxStreak = Math.max(maxStreak, currentStreak)
        currentStreak = 1
      }
    }

    return Math.max(maxStreak, currentStreak)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 dark:text-gray-400'
      case 'rare': return 'text-blue-600 dark:text-blue-400'
      case 'epic': return 'text-purple-600 dark:text-purple-400'
      case 'legendary': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 dark:bg-gray-700'
      case 'rare': return 'bg-blue-100 dark:bg-blue-900/20'
      case 'epic': return 'bg-purple-100 dark:bg-purple-900/20'
      case 'legendary': return 'bg-orange-100 dark:bg-orange-900/20'
      default: return 'bg-gray-100 dark:bg-gray-700'
    }
  }

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100)
  }

  const completedAchievements = achievements.filter(a => a.isCompleted).length
  const totalAchievements = achievements.length

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
          <Trophy className="h-5 w-5 mr-2" />
          Achievement System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Progress</h4>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {completedAchievements}/{totalAchievements}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedAchievements / totalAchievements) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {completedAchievements === totalAchievements 
              ? '🎉 All achievements unlocked!' 
              : `${totalAchievements - completedAchievements} more to go!`
            }
          </p>
        </div>

        {/* Achievement Categories */}
        <div className="space-y-4">
          {['milestone', 'efficiency', 'consistency', 'savings'].map((category) => {
            const categoryAchievements = achievements.filter(a => a.category === category)
            const completedInCategory = categoryAchievements.filter(a => a.isCompleted).length

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900 dark:text-white capitalize">
                    {category} Achievements
                  </h5>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {completedInCategory}/{categoryAchievements.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        achievement.isCompleted
                          ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getRarityBg(achievement.rarity)}`}>
                          <span className="text-lg">{achievement.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h6 className={`font-medium text-sm ${getRarityColor(achievement.rarity)}`}>
                              {achievement.title}
                            </h6>
                            {achievement.isCompleted && (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {achievement.description}
                          </p>
                          
                          {!achievement.isCompleted && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>
                                  {achievement.category === 'efficiency' 
                                    ? `${achievement.currentProgress.toFixed(1)}/${achievement.requirement} km/L`
                                    : achievement.category === 'savings'
                                    ? `Rp ${achievement.currentProgress.toLocaleString()}/${achievement.requirement.toLocaleString()}`
                                    : `${achievement.currentProgress}/${achievement.requirement}`
                                  }
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                                <div
                                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${getProgressPercentage(achievement.currentProgress, achievement.requirement)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalRecords}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Records</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.averageEfficiency.toFixed(1)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg km/L</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.consecutiveDays}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Best Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.monthlyRecords}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">This Month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 