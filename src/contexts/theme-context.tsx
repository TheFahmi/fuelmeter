'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Apply theme immediately to prevent flashing
  const applyTheme = (darkMode: boolean) => {
    console.log('Applying theme:', darkMode ? 'dark' : 'light')
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
  }

  // Initialize theme
  useEffect(() => {
    setMounted(true)
    
    const savedTheme = localStorage.getItem('theme')
    console.log('Saved theme:', savedTheme)
    
    // Default to light mode if no preference is saved
    let initialDarkMode = false
    
    if (savedTheme === 'dark') {
      initialDarkMode = true
    } else if (savedTheme === 'light') {
      initialDarkMode = false
    } else {
      // Default to light mode for new users
      initialDarkMode = false
      localStorage.setItem('theme', 'light')
    }
    
    console.log('Initial dark mode:', initialDarkMode)
    setIsDarkMode(initialDarkMode)
    applyTheme(initialDarkMode)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    console.log('Toggle theme:', { from: isDarkMode, to: newDarkMode })
    
    // Update state
    setIsDarkMode(newDarkMode)
    
    // Apply theme immediately
    applyTheme(newDarkMode)
    
    // Save preference
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    
    // Force re-render
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'))
    }, 0)
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
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