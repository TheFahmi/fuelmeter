'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

interface PremiumData {
  subscription_type?: string
  premium_expires_at?: string
  premium_started_at?: string
}

interface PremiumContextType {
  isPremium: boolean
  premiumData: PremiumData | null
  loading: boolean
  premiumFeatures: {
    unlimitedReports: boolean
    advancedAnalytics: boolean
    aiReceiptScanner: boolean
    prioritySupport: boolean
    realTimeSync: boolean
    earlyAccess: boolean
  }
  checkFeatureAccess: (feature: string) => boolean
  upgradeRequired: (feature: string) => void
  checkPremiumStatus: () => Promise<void>
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  premiumData: null,
  loading: true,
  premiumFeatures: {
    unlimitedReports: false,
    advancedAnalytics: false,
    aiReceiptScanner: false,
    prioritySupport: false,
    realTimeSync: false,
    earlyAccess: false
  },
  checkFeatureAccess: () => false,
  upgradeRequired: () => {},
  checkPremiumStatus: async () => {}
})

export function usePremium() {
  const context = useContext(PremiumContext)
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider')
  }
  return context
}

interface PremiumProviderProps {
  children: ReactNode
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false)
  const [premiumData, setPremiumData] = useState<PremiumData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Check premium status
  const checkPremiumStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium, premium_expires_at, premium_started_at, subscription_type')
          .eq('id', user.id)
          .single()

        if (profile) {
          const now = new Date()
          const expiresAt = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null
          const isActive = profile.is_premium && (!expiresAt || expiresAt > now)
          setIsPremium(isActive)
          setPremiumData({
            subscription_type: profile.subscription_type,
            premium_expires_at: profile.premium_expires_at,
            premium_started_at: profile.premium_started_at
          })
        }
      }
    } catch (error) {
      console.error('Error checking premium status:', error)
      setIsPremium(false)
      setPremiumData(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    checkPremiumStatus()
  }, [checkPremiumStatus])

  // checkPremiumStatus defined with useCallback above

  const premiumFeatures = {
    unlimitedReports: isPremium,
    advancedAnalytics: isPremium,
    aiReceiptScanner: isPremium,
    prioritySupport: isPremium,
    realTimeSync: isPremium,
    earlyAccess: isPremium
  }

  const checkFeatureAccess = (feature: string): boolean => {
    switch (feature) {
      case 'unlimited_reports':
        return premiumFeatures.unlimitedReports
      case 'advanced_analytics':
        return premiumFeatures.advancedAnalytics
      case 'ai_receipt_scanner':
        return premiumFeatures.aiReceiptScanner
      case 'priority_support':
        return premiumFeatures.prioritySupport
      case 'real_time_sync':
        return premiumFeatures.realTimeSync
      case 'early_access':
        return premiumFeatures.earlyAccess
      default:
        return false
    }
  }

  const upgradeRequired = (feature: string) => {
    // This will be handled by components that need to show upgrade modal
    console.log(`Premium upgrade required for feature: ${feature}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <PremiumContext.Provider value={{
      isPremium,
      premiumData,
      loading,
      premiumFeatures,
      checkFeatureAccess,
      upgradeRequired,
      checkPremiumStatus
    }}>
      {children}
    </PremiumContext.Provider>
  )
}

// Hook for components that need to check premium access
export function usePremiumFeature(feature: string) {
  const { checkFeatureAccess, isPremium } = usePremium()
  const hasAccess = checkFeatureAccess(feature)
  
  return {
    hasAccess,
    isPremium,
    requiresUpgrade: !hasAccess
  }
}
