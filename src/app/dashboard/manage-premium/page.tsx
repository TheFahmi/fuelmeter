'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { usePremium } from '@/contexts/premium-context'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BurgerMenu } from '@/components/ui/menu'
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  X,
  RefreshCw,

  Settings,
  ArrowLeft
} from 'lucide-react'

interface SubscriptionData {
  id: string
  subscription_type: string
  premium_expires_at: string
  premium_started_at: string
  is_premium: boolean
  payment_method?: string
  last_payment_at?: string
}

export default function ManagePremiumPage() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [extending, setExtending] = useState(false)
  const { isPremium, checkPremiumStatus } = usePremium()

  const router = useRouter()
  const supabase = createClient()

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_premium, subscription_type, premium_expires_at, premium_started_at, payment_method, last_payment_at')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setSubscriptionData(data)
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchSubscriptionData()
  }, [fetchSubscriptionData])
  // duplicate fetchSubscriptionData removed; using useCallback version above

  const cancelSubscription = async () => {
    try {
      setCancelling(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: false,
          subscription_type: null,
          premium_expires_at: null
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Premium subscription cancelled successfully')
      await checkPremiumStatus()
      await fetchSubscriptionData()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const extendSubscription = async (months: number) => {
    try {
      setExtending(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const currentExpiry = subscriptionData?.premium_expires_at 
        ? new Date(subscriptionData.premium_expires_at)
        : new Date()
      
      const newExpiry = new Date(currentExpiry)
      newExpiry.setMonth(newExpiry.getMonth() + months)

      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: true,
          subscription_type: months === 1 ? 'monthly' : 'yearly',
          premium_expires_at: newExpiry.toISOString(),
          premium_started_at: subscriptionData?.premium_started_at || new Date().toISOString(),
          last_payment_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success(`Premium subscription extended for ${months} month(s)`)
      await checkPremiumStatus()
      await fetchSubscriptionData()
    } catch (error) {
      console.error('Error extending subscription:', error)
      toast.error('Failed to extend subscription')
    } finally {
      setExtending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-white/80">Loading subscription data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-md bg-white/85 border border-black/10 dark:bg-white/10 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Premium</h1>
                </div>
                <p className="text-slate-700 dark:text-white/70">
                  Manage your premium subscription and billing
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="bg-white text-slate-900 border-gray-300 hover:bg-gray-100 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/85 border border-black/10 dark:bg-white/10 dark:border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900 dark:text-white">
                <Crown className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-white/70">Status:</span>
                <Badge 
                  variant={isPremium ? "default" : "secondary"}
                  className={isPremium ? "bg-green-600 text-white" : "bg-gray-200 text-slate-900 dark:bg-gray-600 dark:text-white"}
                >
                  {isPremium ? "Premium Active" : "Free Plan"}
                </Badge>
              </div>
              
              {subscriptionData?.subscription_type && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-white/70">Plan Type:</span>
                  <span className="text-slate-900 dark:text-white capitalize">
                    {subscriptionData.subscription_type}
                  </span>
                </div>
              )}
              
              {subscriptionData?.premium_started_at && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-white/70">Started:</span>
                  <span className="text-slate-900 dark:text-white">
                    {formatDate(subscriptionData.premium_started_at)}
                  </span>
                </div>
              )}
              
              {subscriptionData?.premium_expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-white/70">Expires:</span>
                  <div className="text-right">
                    <span className="text-slate-900 dark:text-white">
                      {formatDate(subscriptionData.premium_expires_at)}
                    </span>
                    {isPremium && !isExpired(subscriptionData.premium_expires_at) && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {getDaysRemaining(subscriptionData.premium_expires_at)} days remaining
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/85 border border-black/10 dark:bg-white/10 dark:border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900 dark:text-white">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-white/70">Payment Method:</span>
                <span className="text-slate-900 dark:text-white">
                  {subscriptionData?.payment_method || 'Not set'}
                </span>
              </div>
              
              {subscriptionData?.last_payment_at && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-white/70">Last Payment:</span>
                  <span className="text-slate-900 dark:text-white">
                    {formatDate(subscriptionData.last_payment_at)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-white/70">Next Billing:</span>
                <span className="text-slate-900 dark:text-white">
                  {subscriptionData?.premium_expires_at && isPremium
                    ? formatDate(subscriptionData.premium_expires_at)
                    : 'N/A'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Extend Subscription */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Calendar className="h-5 w-5 mr-2 text-green-400" />
                Extend Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/70 text-sm">
                Extend your premium subscription to continue enjoying all premium features.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => extendSubscription(1)}
                  disabled={extending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {extending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Extend 1 Month - Rp 49,000
                </Button>

                <Button
                  onClick={() => extendSubscription(12)}
                  disabled={extending}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {extending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Extend 1 Year - Rp 490,000 (Save 17%)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Settings className="h-5 w-5 mr-2 text-gray-400" />
                Subscription Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={fetchSubscriptionData}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>

                <Button
                  onClick={() => router.push('/dashboard/premium')}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  View Premium Features
                </Button>

                {isPremium && (
                  <Button
                    onClick={cancelSubscription}
                    disabled={cancelling}
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {cancelling ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Cancel Subscription
                  </Button>
                )}
              </div>

              {!isPremium && (
                <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-slate-900 dark:text-yellow-200">Free Plan</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-yellow-200/80">
                    You&apos;re currently on the free plan. Upgrade to premium to unlock all features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Premium Features Reminder */}
        {isPremium && (
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl mt-6">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                Your Premium Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white/80">Unlimited PDF Reports</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white/80">Advanced Analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white/80">AI Receipt Scanner</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white/80">Priority Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white/80">Multi-Vehicle Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white/80">Carbon Footprint Tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
