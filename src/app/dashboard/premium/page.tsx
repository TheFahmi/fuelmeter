'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { usePremium } from '@/contexts/premium-context'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Check, 
  X, 

  Star,
  Sparkles
} from 'lucide-react'

interface PlanFeature {
  name: string
  free: boolean | string
  premium: boolean | string
}

const features: PlanFeature[] = [
  { name: 'Fuel Records per Month', free: '10', premium: 'Unlimited' },
  { name: 'PDF Reports', free: '1 per month', premium: 'Unlimited' },
  { name: 'AI Receipt Scanner', free: false, premium: true },
  { name: 'Advanced Analytics', free: false, premium: true },
  { name: 'Data Export (CSV/Excel)', free: false, premium: true },
  { name: 'Real-time Sync', free: false, premium: true },
  { name: 'Priority Support', free: false, premium: true },
  { name: 'Early Access Features', free: false, premium: true },
  { name: 'Custom Categories', free: '3', premium: 'Unlimited' },
  { name: 'Backup & Restore', free: false, premium: true },
  { name: 'Multi-vehicle Support', free: '1 vehicle', premium: 'Unlimited' },
  { name: 'Carbon Footprint Tracking', free: false, premium: true }
]

export default function PremiumPage() {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const { isPremium, premiumData, checkPremiumStatus, loading: premiumLoading } = usePremium()

  const router = useRouter()
  const supabase = createClient()

  const plans = {
    monthly: {
      price: 49000,
      period: 'month',
      savings: 0,
      popular: false
    },
    yearly: {
      price: 490000,
      period: 'year',
      savings: 98000, // 12 * 49000 - 490000
      popular: true
    }
  }

  useEffect(() => {
    if (checkPremiumStatus) {
      checkPremiumStatus()
    }
  }, [checkPremiumStatus])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleUpgrade = async (planType: 'monthly' | 'yearly') => {
    setLoading(true)
    try {
      // Simulate payment process
      // In real app, integrate with payment gateway like Midtrans
      
      const plan = plans[planType]
      const expiresAt = new Date()
      if (planType === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      }

      // Create subscription record
      const { error: subscriptionError } = await supabase
        .from('premium_subscriptions')
        .insert({
          subscription_type: planType,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          amount: plan.price,
          currency: 'IDR'
        })

      if (subscriptionError) throw subscriptionError

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
          premium_started_at: new Date().toISOString(),
          subscription_type: planType
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)

      if (profileError) throw profileError

      toast.success(`Welcome to FuelMeter Premium! Your ${planType} subscription is now active.`)

      // Refresh premium status
      if (checkPremiumStatus) {
        await checkPremiumStatus()
      }
      
      // Redirect to dashboard
      router.push('/dashboard')

    } catch (error) {
      console.error('Error upgrading to premium:', error)
      toast.error('Failed to upgrade to premium. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-gray-400" />
      )
    }
    return <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
  }

  if (premiumLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading premium status...</p>
        </div>
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Premium Status */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
              <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              You&apos;re Premium! 🎉
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enjoy all the premium features of FuelMeter
            </p>
          </div>

          {/* Current Subscription */}
          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-900 dark:text-yellow-100">
                <Sparkles className="h-5 w-5 mr-2" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Plan</p>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100 capitalize">
                    {premiumData?.subscription_type || 'Premium'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Status</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Active
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Expires</p>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    {premiumData?.premium_expires_at 
                      ? new Date(premiumData.premium_expires_at).toLocaleDateString('id-ID')
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Your Premium Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.filter(f => f.premium === true || typeof f.premium === 'string').map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{feature.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center mt-8">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="mr-4"
            >
              Back to Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/manage-premium')}
            >
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
            <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock powerful features to track your fuel consumption like a pro
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Monthly Plan */}
          <Card className={`relative ${selectedPlan === 'monthly' ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Monthly Plan</CardTitle>
                  <p className="text-gray-600 dark:text-gray-400">Perfect for trying premium</p>
                </div>
                <Button
                  variant={selectedPlan === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlan('monthly')}
                >
                  Select
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(plans.monthly.price)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={() => handleUpgrade('monthly')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Start Monthly Plan'}
              </Button>
            </CardContent>
          </Card>

          {/* Yearly Plan */}
          <Card className={`relative ${selectedPlan === 'yearly' ? 'ring-2 ring-blue-500' : ''}`}>
            {plans.yearly.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-500 text-yellow-900 px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Yearly Plan</CardTitle>
                  <p className="text-gray-600 dark:text-gray-400">Save 2 months free!</p>
                </div>
                <Button
                  variant={selectedPlan === 'yearly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlan('yearly')}
                >
                  Select
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(plans.yearly.price)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/year</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Save {formatCurrency(plans.yearly.savings)}
                  </Badge>
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={() => handleUpgrade('yearly')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Start Yearly Plan'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-gray-900 dark:text-white">
              Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Feature</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Free</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center justify-center">
                        <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                        Premium
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{feature.name}</td>
                      <td className="py-3 px-4 text-center">
                        {renderFeatureValue(feature.free)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderFeatureValue(feature.premium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          {isPremium && (
            <Button
              onClick={() => router.push('/dashboard/manage-premium')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Manage Subscription
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
