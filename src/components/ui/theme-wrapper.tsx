'use client'

import { useTheme } from '@/contexts/theme-context'
import { ClientOnly } from './client-only'

interface ThemeWrapperProps {
  children: (props: { isDarkMode: boolean; toggleDarkMode: () => void }) => React.ReactNode
  fallback?: React.ReactNode
}

export function ThemeWrapper({ children, fallback }: ThemeWrapperProps) {
  return (
    <ClientOnly fallback={fallback}>
      <ThemeWrapperInner>{children}</ThemeWrapperInner>
    </ClientOnly>
  )
}

function ThemeWrapperInner({ children }: { children: (props: { isDarkMode: boolean; toggleDarkMode: () => void }) => React.ReactNode }) {
  const { isDarkMode, toggleDarkMode, isLoading } = useTheme()
  
  console.log('🎯 ThemeWrapper state:', { isDarkMode, isLoading })
  
  // Show loading or fallback while theme is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading theme...</p>
        </div>
      </div>
    )
  }
  
  return <>{children({ isDarkMode, toggleDarkMode })}</>
} 