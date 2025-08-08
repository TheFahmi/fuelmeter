'use client'

import { Crown, Sparkles } from 'lucide-react'

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal'
  showText?: boolean
  className?: string
}

export function PremiumBadge({ size = 'md', variant = 'default', showText = true, className = '' }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const variantClasses = {
    default: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 shadow-lg',
    minimal: 'text-yellow-600 dark:text-yellow-400'
  }

  return (
    <div className={`
      inline-flex items-center space-x-1 rounded-full font-medium
      ${variant === 'default' ? variantClasses.default : variantClasses.minimal}
      ${sizeClasses[size]} ${className}
    `}>
      <Crown className={iconSizes[size]} />
      {showText && <span>Premium</span>}
      <Sparkles className={iconSizes[size]} />
    </div>
  )
}

interface PremiumFeatureBadgeProps {
  className?: string
}

export function PremiumFeatureBadge({ className = '' }: PremiumFeatureBadgeProps) {
  return (
    <div className={`
      inline-flex items-center space-x-1 px-2 py-1 rounded-md
      bg-gradient-to-r from-purple-500 to-pink-500
      text-white text-xs font-medium shadow-sm
      ${className}
    `}>
      <Crown className="h-3 w-3" />
      <span>Premium</span>
    </div>
  )
}
