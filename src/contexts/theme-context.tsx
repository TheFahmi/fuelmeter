'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  isLoading: false
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false) // Default to LIGHT mode

  // Function to apply theme to DOM
  const applyTheme = (dark: boolean) => {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    if (dark) {
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
        console.log('🎨 Initializing theme system')

        // Check localStorage for saved theme preference
        const savedTheme = localStorage.getItem('theme')

        // Determine theme: saved preference > default (LIGHT)
        const shouldUseDark = savedTheme ? savedTheme === 'dark' : false

        console.log('Theme decision:', { savedTheme, shouldUseDark })

        setIsDarkMode(shouldUseDark)
        applyTheme(shouldUseDark)

        // Persist explicit value for consistency
        localStorage.setItem('theme', shouldUseDark ? 'dark' : 'light')

      } catch (error) {
        console.error('❌ Theme initialization error:', error)
        // Fallback to light mode
        setIsDarkMode(false)
        applyTheme(false)
        localStorage.setItem('theme', 'light')
      } finally {
        setIsLoading(false)
      }
    }

    initTheme()
  }, [])

  // Toggle theme function
  const toggleDarkMode = () => {
    const newTheme = !isDarkMode
    console.log('🔄 Toggling theme to:', newTheme ? 'dark' : 'light')

    setIsDarkMode(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  return context
}