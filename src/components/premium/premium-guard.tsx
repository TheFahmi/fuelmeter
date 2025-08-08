'use client'

import { useState } from 'react'
import { usePremium } from '@/contexts/premium-context'
import { UpgradeModal } from './upgrade-modal'
// import { PremiumFeatureBadge } from './premium-badge' // Uncomment when needed
import { Lock, Crown } from 'lucide-react'

interface PremiumGuardProps {
  children: React.ReactNode
  feature: string
  fallback?: React.ReactNode
  showUpgradeButton?: boolean
}

export function PremiumGuard({ 
  children, 
  feature, 
  fallback, 
  showUpgradeButton = true 
}: PremiumGuardProps) {
  const { isPremium } = usePremium()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  if (isPremium) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none opacity-50">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
              <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Premium Feature
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upgrade to Premium to unlock <span className="font-semibold text-yellow-600 dark:text-yellow-400">{feature}</span>
            </p>
            {showUpgradeButton && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
      />
    </>
  )
}

interface PremiumFeatureProps {
  feature: string
  children: React.ReactNode
  className?: string
}

export function PremiumFeature({ feature, children, className = '' }: PremiumFeatureProps) {
  const { isPremium } = usePremium()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  if (isPremium) {
    return <div className={className}>{children}</div>
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full hover:bg-yellow-600 transition-colors"
          >
            <Lock className="h-3 w-3 mr-1" />
            Premium
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
      />
    </>
  )
}

interface PremiumButtonProps {
  feature: string
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function PremiumButton({ 
  feature, 
  children, 
  onClick, 
  className = '', 
  disabled = false 
}: PremiumButtonProps) {
  const { isPremium } = usePremium()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleClick = () => {
    if (isPremium && onClick) {
      onClick()
    } else if (!isPremium) {
      setShowUpgradeModal(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`relative ${className} ${!isPremium ? 'cursor-pointer' : ''}`}
      >
        {children}
        {!isPremium && (
          <div className="absolute -top-1 -right-1">
            <Crown className="h-4 w-4 text-yellow-500" />
          </div>
        )}
      </button>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
      />
    </>
  )
}
