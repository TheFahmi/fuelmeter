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
  const { isDarkMode, toggleDarkMode } = useTheme()
  
  console.log('ThemeWrapper isDarkMode:', isDarkMode)
  
  return <>{children({ isDarkMode, toggleDarkMode })}</>
} 