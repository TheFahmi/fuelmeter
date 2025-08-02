'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Target, Users, Star, Zap, Award, Crown } from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'special'
  category: 'efficiency' | 'savings' | 'consistency' | 'distance'
  requirement: number
  current: number
  progress: number
  reward: {
    points: number
    badge?: string
    title?: string
  }
  isCompleted: boolean
  expiresAt: string
  participants: number
}

interface LeaderboardEntry {
  rank: number
  displayName: string
  points: number
  achievements: number
  efficiency: number
}

interface FuelRecord {
  id: string
  date: string
  fuel_type: string
  quantity: number
  total_cost: number
  distance_km: number
  created_at: string
}

export function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<{
    totalRecords: number
    totalCost: number
    totalDistance: number
    averageEfficiency: number
    points: number
    achievements: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges')
  const supabase = createClient()

  const loadChallenges = useCallback(async () => {
    try {
      // Get user's current stats
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: true })

      if (!records) return

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000))

      // Calculate current stats
      const totalRecords = records.length
      const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
      const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
      const totalFuel = records.reduce((sum, record) => sum + record.quantity, 0)
      const averageEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0

      // Monthly stats
      const monthlyRecords = records.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
      })
      const monthlyCost = monthlyRecords.reduce((sum, record) => sum + record.total_cost, 0)

      // Weekly stats
      const weeklyRecords = records.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate >= startOfWeek
      })
      const weeklyCost = weeklyRecords.reduce((sum, record) => sum + record.total_cost, 0)

      // Daily stats (today)
      const today = now.toISOString().split('T')[0]
      const todayRecords = records.filter(record => record.date === today)
      const todayCost = todayRecords.reduce((sum, record) => sum + record.total_cost, 0)

      // Define challenges
      const challengeDefinitions: Challenge[] = [
        // Daily Challenges
        {
          id: 'daily_efficiency',
          title: 'Efficiency Master',
          description: 'Achieve 15+ km/L efficiency today',
          type: 'daily',
          category: 'efficiency',
          requirement: 15,
          current: averageEfficiency,
          progress: Math.min(100, (averageEfficiency / 15) * 100),
          reward: { points: 50, badge: '🌱', title: 'Eco Warrior' },
          isCompleted: averageEfficiency >= 15,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          participants: 1250
        },
        {
          id: 'daily_savings',
          title: 'Smart Spender',
          description: 'Spend less than Rp 100,000 today',
          type: 'daily',
          category: 'savings',
          requirement: 100000,
          current: todayCost,
          progress: Math.min(100, (todayCost / 100000) * 100),
          reward: { points: 30, badge: '💰', title: 'Money Saver' },
          isCompleted: todayCost < 100000,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          participants: 890
        },

        // Weekly Challenges
        {
          id: 'weekly_consistency',
          title: 'Consistency King',
          description: 'Record fuel data for 5 consecutive days',
          type: 'weekly',
          category: 'consistency',
          requirement: 5,
          current: calculateConsecutiveDays(records),
          progress: Math.min(100, (calculateConsecutiveDays(records) / 5) * 100),
          reward: { points: 100, badge: '🔥', title: 'Streak Master' },
          isCompleted: calculateConsecutiveDays(records) >= 5,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 567
        },
        {
          id: 'weekly_distance',
          title: 'Road Warrior',
          description: 'Travel 500+ km this week',
          type: 'weekly',
          category: 'distance',
          requirement: 500,
          current: weeklyRecords.reduce((sum, record) => sum + record.distance_km, 0),
          progress: Math.min(100, (weeklyRecords.reduce((sum, record) => sum + record.distance_km, 0) / 500) * 100),
          reward: { points: 75, badge: '🚗', title: 'Road Master' },
          isCompleted: weeklyRecords.reduce((sum, record) => sum + record.distance_km, 0) >= 500,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 423
        },

        // Monthly Challenges
        {
          id: 'monthly_savings',
          title: 'Budget Master',
          description: 'Keep monthly fuel cost under Rp 1,000,000',
          type: 'monthly',
          category: 'savings',
          requirement: 1000000,
          current: monthlyCost,
          progress: Math.min(100, (monthlyCost / 1000000) * 100),
          reward: { points: 200, badge: '🏆', title: 'Budget Champion' },
          isCompleted: monthlyCost < 1000000,
          expiresAt: new Date(currentYear, currentMonth + 1, 0).toISOString(),
          participants: 234
        },
        {
          id: 'monthly_efficiency',
          title: 'Eco Champion',
          description: 'Maintain 12+ km/L average for the month',
          type: 'monthly',
          category: 'efficiency',
          requirement: 12,
          current: monthlyRecords.length > 0 ? 
            monthlyRecords.reduce((sum, record) => sum + record.distance_km, 0) / 
            monthlyRecords.reduce((sum, record) => sum + record.quantity, 0) : 0,
          progress: Math.min(100, ((monthlyRecords.length > 0 ? 
            monthlyRecords.reduce((sum, record) => sum + record.distance_km, 0) / 
            monthlyRecords.reduce((sum, record) => sum + record.quantity, 0) : 0) / 12) * 100),
          reward: { points: 150, badge: '🌍', title: 'Environmental Hero' },
          isCompleted: monthlyRecords.length > 0 && 
            (monthlyRecords.reduce((sum, record) => sum + record.distance_km, 0) / 
             monthlyRecords.reduce((sum, record) => sum + record.quantity, 0)) >= 12,
          expiresAt: new Date(currentYear, currentMonth + 1, 0).toISOString(),
          participants: 156
        },

        // Special Challenges
        {
          id: 'special_century',
          title: 'Century Club',
          description: 'Record 100 fuel entries',
          type: 'special',
          category: 'consistency',
          requirement: 100,
          current: totalRecords,
          progress: Math.min(100, (totalRecords / 100) * 100),
          reward: { points: 500, badge: '💎', title: 'Century Master' },
          isCompleted: totalRecords >= 100,
          expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 89
        },
        {
          id: 'special_distance',
          title: 'Long Distance Runner',
          description: 'Travel 10,000+ km total',
          type: 'special',
          category: 'distance',
          requirement: 10000,
          current: totalDistance,
          progress: Math.min(100, (totalDistance / 10000) * 100),
          reward: { points: 300, badge: '🏃', title: 'Distance Legend' },
          isCompleted: totalDistance >= 10000,
          expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 67
        }
      ]

      setChallenges(challengeDefinitions)

    } catch (error) {
      console.error('Error loading challenges:', error)
    }
  }, [supabase])

  const calculateConsecutiveDays = (records: FuelRecord[]) => {
    if (records.length === 0) return 0
    
    const sortedDates = records.map(r => r.date).sort().reverse()
    let consecutiveDays = 1
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currDate = new Date(sortedDates[i])
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        consecutiveDays++
      } else {
        break
      }
    }
    
    return consecutiveDays
  }

  const loadLeaderboard = useCallback(async () => {
    try {
      // Simulate leaderboard data
      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, displayName: 'EcoDriver_2024', points: 2840, achievements: 15, efficiency: 18.5 },
        { rank: 2, displayName: 'FuelSaver_Pro', points: 2650, achievements: 14, efficiency: 17.2 },
        { rank: 3, displayName: 'GreenRider', points: 2480, achievements: 13, efficiency: 16.8 },
        { rank: 4, displayName: 'BudgetMaster', points: 2310, achievements: 12, efficiency: 15.9 },
        { rank: 5, displayName: 'EfficiencyKing', points: 2150, achievements: 11, efficiency: 16.2 },
        { rank: 6, displayName: 'RoadWarrior', points: 1980, achievements: 10, efficiency: 14.8 },
        { rank: 7, displayName: 'ConsistencyChamp', points: 1820, achievements: 9, efficiency: 15.1 },
        { rank: 8, displayName: 'CarbonCrusher', points: 1650, achievements: 8, efficiency: 16.5 },
        { rank: 9, displayName: 'MileageMaster', points: 1480, achievements: 7, efficiency: 13.9 },
        { rank: 10, displayName: 'FuelTracker', points: 1320, achievements: 6, efficiency: 14.2 }
      ]
      
      setLeaderboard(mockLeaderboard)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }, [])

  const loadUserStats = useCallback(async () => {
    try {
      const { data: records } = await supabase
        .from('fuel_records')
        .select('*')

      if (!records) return

      const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
      const totalDistance = records.reduce((sum, record) => sum + record.distance_km, 0)
      const totalFuel = records.reduce((sum, record) => sum + record.quantity, 0)
      const averageEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0

      setUserStats({
        totalRecords: records.length,
        totalCost,
        totalDistance,
        averageEfficiency,
        points: 1250, // Mock points
        achievements: 8 // Mock achievements
      })
    } catch (error) {
      console.error('Error loading user stats:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadChallenges()
    loadLeaderboard()
    loadUserStats()
  }, [loadChallenges, loadLeaderboard, loadUserStats])

  const getChallengeIcon = (category: string) => {
    switch (category) {
      case 'efficiency': return <Zap className="h-5 w-5" />
      case 'savings': return <Award className="h-5 w-5" />
      case 'consistency': return <Target className="h-5 w-5" />
      case 'distance': return <Trophy className="h-5 w-5" />
      default: return <Star className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'weekly': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'monthly': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'special': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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
            <Trophy className="h-5 w-5 mr-2" />
            Challenges & Leaderboard
          </div>
          {userStats && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">{userStats.points} pts</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">{userStats.achievements}</span>
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'challenges'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Challenges
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {activeTab === 'challenges' ? (
          /* Challenges Tab */
          <div className="space-y-4">
            {challenges.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Challenges Available
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Check back later for new challenges!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`p-4 rounded-lg border ${
                      challenge.isCompleted 
                        ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        {getChallengeIcon(challenge.category)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {challenge.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(challenge.type)}`}>
                              {challenge.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                      {challenge.isCompleted && (
                        <div className="text-green-600 dark:text-green-400">
                          <Star className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{challenge.current}/{challenge.requirement}</span>
                        <span>{challenge.progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            challenge.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(challenge.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Reward & Participants */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          {challenge.reward.points} pts
                        </span>
                        {challenge.reward.badge && (
                          <span className="text-lg">{challenge.reward.badge}</span>
                        )}
                        {challenge.reward.title && (
                          <span className="text-gray-600 dark:text-gray-400">
                            {challenge.reward.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <Users className="h-3 w-3" />
                        <span>{challenge.participants}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Leaderboard Tab */
          <div className="space-y-4">
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.rank}
                  className={`flex items-center space-x-4 p-3 rounded-lg ${
                    index < 3 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700' 
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600">
                    {index < 3 ? (
                      <Crown className={`h-4 w-4 ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        'text-orange-500'
                      }`} />
                    ) : (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {entry.displayName}
                    </h4>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{entry.achievements} achievements</span>
                      <span>{entry.efficiency.toFixed(1)} km/L</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {entry.points.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      points
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* User's Position */}
            {userStats && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Your Position
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Keep up the good work!
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      #{Math.floor(Math.random() * 50) + 25}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      of {Math.floor(Math.random() * 1000) + 500} users
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 