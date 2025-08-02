'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode] = useState(true) // Always dark mode

  // Function to apply dark theme to DOM
  const applyDarkTheme = () => {
    const root = document.documentElement
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
    console.log('✅ Applied DARK theme')
  }

  // Initialize dark theme on mount
  useEffect(() => {
    const initTheme = () => {
      try {
        console.log('🎨 Initializing dark theme')
        
        // Always apply dark theme
        applyDarkTheme()
        
        // Save to localStorage
        localStorage.setItem('theme', 'dark')
        
      } catch (error) {
        console.error('❌ Theme initialization error:', error)
        // Fallback to dark mode
        applyDarkTheme()
        localStorage.setItem('theme', 'dark')
      } finally {
        setIsLoading(false)
      }
    }

    initTheme()
  }, [])

  // Dummy function for compatibility
  const toggleDarkMode = () => {
    console.log('🔄 Theme toggle disabled - always dark mode')
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 