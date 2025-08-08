'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Crown, Sparkles, Zap, BarChart3, FileText, Camera, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: string
}

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [loading] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const plans = {
    monthly: {
      price: 'Rp 49,000',
      period: '/month',
      savings: null
    },
    yearly: {
      price: 'Rp 490,000',
      period: '/year',
      savings: 'Save 17%'
    }
  }

  const features = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Advanced Analytics',
      description: 'Detailed insights, trends, and forecasting'
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Unlimited PDF Reports',
      description: 'Generate unlimited professional reports'
    },
    {
      icon: <Camera className="h-5 w-5" />,
      title: 'AI Receipt Scanner',
      description: 'Unlimited receipt scanning with AI'
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Real-time Sync',
      description: 'Sync across all your devices instantly'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Priority Support',
      description: '24/7 premium customer support'
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'Early Access',
      description: 'Get new features before everyone else'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 text-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Upgrade to Premium
          </h2>
          <p className="text-yellow-100">
            {feature ? `Unlock ${feature} and more premium features` : 'Unlock all premium features and take your fuel tracking to the next level'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plans.monthly.price}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {plans.monthly.period}
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`p-4 rounded-xl border-2 transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {plans.yearly.savings && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {plans.yearly.savings}
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plans.yearly.price}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {plans.yearly.period}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Premium Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-shrink-0 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3"
              size="lg"
              onClick={() => router.push('/dashboard/premium')}
              disabled={loading}
            >
              <Crown className="h-5 w-5 mr-2" />
              {loading ? 'Processing...' : 'Upgrade to Premium'}
            </Button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              30-day money-back guarantee • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
