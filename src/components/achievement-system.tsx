'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Target, Zap, Calendar, DollarSign, TrendingUp, Award } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'milestone' | 'efficiency' | 'consistency' | 'savings'
  requirement: number
  current: number
  progress: number
  isUnlocked: boolean
  unlockedAt?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface UserStats {
  totalRecords: number
  totalCost: number
  totalDistance: number
  averageEfficiency: number
  consecutiveDays: number
  totalSavings: number
  streakDays: number
}

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      // Get user stats
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: true })

      if (!records || records.length === 0) {
        setUserStats({
          totalRecords: 0,
          totalCost: 0,
          totalDistance: 0,
          averageEfficiency: 0,
          consecutiveDays: 0,
          totalSavings: 0,
          streakDays: 0
        })
        setAchievements([])
        return
      }

      // Calculate user stats
      const totalRecords = records.length
      const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
      const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
      const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0)
      const averageEfficiency = totalQuantity > 0 ? totalDistance / totalQuantity : 0

      // Calculate consecutive days
      const sortedDates = records.map(r => r.date).sort()
      let consecutiveDays = 1
      let maxConsecutive = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1])
        const currDate = new Date(sortedDates[i])
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          consecutiveDays++
          maxConsecutive = Math.max(maxConsecutive, consecutiveDays)
        } else {
          consecutiveDays = 1
        }
      }

      // Calculate savings (compare with average user)
      const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
      const benchmarkCostPerKm = 1500 // Average cost per km
      const totalSavings = totalDistance * (benchmarkCostPerKm - averageCostPerKm)

      // Calculate streak (current consecutive days)
      const today = new Date()
      const lastRecordDate = new Date(sortedDates[sortedDates.length - 1])
      const daysSinceLastRecord = Math.floor((today.getTime() - lastRecordDate.getTime()) / (1000 * 60 * 60 * 24))
      const streakDays = daysSinceLastRecord <= 1 ? maxConsecutive : 0

      setUserStats({
        totalRecords,
        totalCost,
        totalDistance,
        averageEfficiency,
        consecutiveDays: maxConsecutive,
        totalSavings: Math.max(0, totalSavings),
        streakDays
      })

      // Define achievements
      const achievementDefinitions: Achievement[] = [
        // Milestone achievements
        {
          id: 'first_record',
          title: 'First Step',
          description: 'Catat pengisian BBM pertama',
          icon: '🎯',
          category: 'milestone',
          requirement: 1,
          current: totalRecords,
          progress: Math.min(100, (totalRecords / 1) * 100),
          isUnlocked: totalRecords >= 1,
          rarity: 'common'
        },
        {
          id: 'ten_records',
          title: 'Dedicated Tracker',
          description: 'Catat 10 pengisian BBM',
          icon: '📊',
          category: 'milestone',
          requirement: 10,
          current: totalRecords,
          progress: Math.min(100, (totalRecords / 10) * 100),
          isUnlocked: totalRecords >= 10,
          rarity: 'common'
        },
        {
          id: 'fifty_records',
          title: 'Fuel Master',
          description: 'Catat 50 pengisian BBM',
          icon: '👑',
          category: 'milestone',
          requirement: 50,
          current: totalRecords,
          progress: Math.min(100, (totalRecords / 50) * 100),
          isUnlocked: totalRecords >= 50,
          rarity: 'rare'
        },
        {
          id: 'hundred_records',
          title: 'Century Club',
          description: 'Catat 100 pengisian BBM',
          icon: '🏆',
          category: 'milestone',
          requirement: 100,
          current: totalRecords,
          progress: Math.min(100, (totalRecords / 100) * 100),
          isUnlocked: totalRecords >= 100,
          rarity: 'epic'
        },

        // Efficiency achievements
        {
          id: 'efficiency_expert',
          title: 'Efficiency Expert',
          description: 'Capai efisiensi 15 km/L',
          icon: '⚡',
          category: 'efficiency',
          requirement: 15,
          current: averageEfficiency,
          progress: Math.min(100, (averageEfficiency / 15) * 100),
          isUnlocked: averageEfficiency >= 15,
          rarity: 'rare'
        },
        {
          id: 'fuel_saver',
          title: 'Fuel Saver',
          description: 'Capai efisiensi 20 km/L',
          icon: '🌱',
          category: 'efficiency',
          requirement: 20,
          current: averageEfficiency,
          progress: Math.min(100, (averageEfficiency / 20) * 100),
          isUnlocked: averageEfficiency >= 20,
          rarity: 'epic'
        },
        {
          id: 'eco_champion',
          title: 'Eco Champion',
          description: 'Capai efisiensi 25 km/L',
          icon: '🌍',
          category: 'efficiency',
          requirement: 25,
          current: averageEfficiency,
          progress: Math.min(100, (averageEfficiency / 25) * 100),
          isUnlocked: averageEfficiency >= 25,
          rarity: 'legendary'
        },

        // Consistency achievements
        {
          id: 'week_streak',
          title: 'Week Warrior',
          description: 'Catat 7 hari berturut-turut',
          icon: '📅',
          category: 'consistency',
          requirement: 7,
          current: maxConsecutive,
          progress: Math.min(100, (maxConsecutive / 7) * 100),
          isUnlocked: maxConsecutive >= 7,
          rarity: 'common'
        },
        {
          id: 'month_streak',
          title: 'Monthly Master',
          description: 'Catat 30 hari berturut-turut',
          icon: '🗓️',
          category: 'consistency',
          requirement: 30,
          current: maxConsecutive,
          progress: Math.min(100, (maxConsecutive / 30) * 100),
          isUnlocked: maxConsecutive >= 30,
          rarity: 'rare'
        },
        {
          id: 'hundred_days',
          title: 'Century Streak',
          description: 'Catat 100 hari berturut-turut',
          icon: '🔥',
          category: 'consistency',
          requirement: 100,
          current: maxConsecutive,
          progress: Math.min(100, (maxConsecutive / 100) * 100),
          isUnlocked: maxConsecutive >= 100,
          rarity: 'legendary'
        },

        // Savings achievements
        {
          id: 'money_saver',
          title: 'Money Saver',
          description: 'Hemat Rp 100,000',
          icon: '💰',
          category: 'savings',
          requirement: 100000,
          current: totalSavings,
          progress: Math.min(100, (totalSavings / 100000) * 100),
          isUnlocked: totalSavings >= 100000,
          rarity: 'common'
        },
        {
          id: 'big_saver',
          title: 'Big Saver',
          description: 'Hemat Rp 500,000',
          icon: '💎',
          category: 'savings',
          requirement: 500000,
          current: totalSavings,
          progress: Math.min(100, (totalSavings / 500000) * 100),
          isUnlocked: totalSavings >= 500000,
          rarity: 'rare'
        },
        {
          id: 'millionaire_saver',
          title: 'Millionaire Saver',
          description: 'Hemat Rp 1,000,000',
          icon: '🏦',
          category: 'savings',
          requirement: 1000000,
          current: totalSavings,
          progress: Math.min(100, (totalSavings / 1000000) * 100),
          isUnlocked: totalSavings >= 1000000,
          rarity: 'epic'
        }
      ]

      setAchievements(achievementDefinitions)

    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 dark:border-gray-600'
      case 'rare': return 'border-blue-300 dark:border-blue-600'
      case 'epic': return 'border-purple-300 dark:border-purple-600'
      case 'legendary': return 'border-yellow-300 dark:border-yellow-600'
      default: return 'border-gray-300 dark:border-gray-600'
    }
  }

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-50 dark:bg-gray-800'
      case 'rare': return 'bg-blue-50 dark:bg-blue-900/20'
      case 'epic': return 'bg-purple-50 dark:bg-purple-900/20'
      case 'legendary': return 'bg-yellow-50 dark:bg-yellow-900/20'
      default: return 'bg-gray-50 dark:bg-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'milestone': return <Target className="h-4 w-4" />
      case 'efficiency': return <Zap className="h-4 w-4" />
      case 'consistency': return <Calendar className="h-4 w-4" />
      case 'savings': return <DollarSign className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
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

  const unlockedAchievements = achievements.filter(a => a.isUnlocked)
  const lockedAchievements = achievements.filter(a => !a.isUnlocked)
  const displayedAchievements = showAll ? achievements : [...unlockedAchievements, ...lockedAchievements.slice(0, 3)]

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <Trophy className="h-5 w-5 mr-2" />
          Achievements
          {unlockedAchievements.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-yellow-500 text-white rounded-full">
              {unlockedAchievements.length}/{achievements.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {userStats.totalRecords}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Records</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {userStats.averageEfficiency.toFixed(1)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">km/L</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {userStats.consecutiveDays}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Best Streak</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Rp {(userStats.totalSavings / 1000).toFixed(0)}k
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Saved</p>
            </div>
          </div>
        )}

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 ${getRarityColor(achievement.rarity)} ${getRarityBg(achievement.rarity)} ${
                achievement.isUnlocked ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>{achievement.current}/{achievement.requirement}</span>
                      <span>{achievement.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          achievement.isUnlocked ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      achievement.isUnlocked 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {achievement.isUnlocked ? 'Unlocked' : 'Locked'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                      achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {achievement.rarity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {achievements.length > 6 && (
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {showAll ? 'Show Less' : `Show ${achievements.length - 6} More Achievements`}
          </Button>
        )}

        {/* Empty State */}
        {achievements.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Achievements Yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Start tracking your fuel consumption to unlock achievements!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 