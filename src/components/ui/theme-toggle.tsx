'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <button
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed bottom-20 right-4 z-50 backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-full p-3 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-all duration-200 shadow-lg"
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}


