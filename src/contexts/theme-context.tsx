'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Function to apply theme to DOM
  const applyTheme = (isDark: boolean) => {
    const root = document.documentElement
    
    if (isDark) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
      console.log('✅ Applied DARK theme')
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
      console.log('✅ Applied LIGHT theme')
    }
  }

  // Initialize theme on mount
  useEffect(() => {
    const initTheme = () => {
      try {
        // Get saved theme from localStorage
        const savedTheme = localStorage.getItem('theme')
        console.log('💾 Saved theme:', savedTheme)
        
        let shouldUseDarkMode = false
        
        if (savedTheme === 'dark') {
          shouldUseDarkMode = true
        } else if (savedTheme === 'light') {
          shouldUseDarkMode = false
        } else {
          // No saved preference - default to light
          shouldUseDarkMode = false
          localStorage.setItem('theme', 'light')
          console.log('🔧 Set default theme to light')
        }
        
        console.log('🎨 Initializing theme:', shouldUseDarkMode ? 'dark' : 'light')
        
        // Apply theme immediately
        applyTheme(shouldUseDarkMode)
        setIsDarkMode(shouldUseDarkMode)
        
      } catch (error) {
        console.error('❌ Theme initialization error:', error)
        // Fallback to light mode
        applyTheme(false)
        setIsDarkMode(false)
        localStorage.setItem('theme', 'light')
      } finally {
        setIsLoading(false)
      }
    }

    initTheme()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    console.log('🔄 Toggle theme:', isDarkMode ? 'dark' : 'light', '→', newDarkMode ? 'dark' : 'light')
    
    // Update state
    setIsDarkMode(newDarkMode)
    
    // Apply to DOM immediately
    applyTheme(newDarkMode)
    
    // Save to localStorage
    const themeValue = newDarkMode ? 'dark' : 'light'
    localStorage.setItem('theme', themeValue)
    console.log('💾 Saved theme:', themeValue)
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