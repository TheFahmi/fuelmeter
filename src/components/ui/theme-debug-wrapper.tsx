'use client'

import { useState, useEffect } from 'react'

export function ThemeDebugWrapper() {
  const [showDebug, setShowDebug] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [htmlClass, setHtmlClass] = useState('')
  const [localStorageTheme, setLocalStorageTheme] = useState('')

  // Update debug info
  useEffect(() => {
    const updateDebugInfo = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark')
      setIsDarkMode(hasDarkClass)
      setHtmlClass(document.documentElement.className)
      setLocalStorageTheme(localStorage.getItem('theme') || 'none')
    }

    updateDebugInfo()
    
    // Update periodically
    const interval = setInterval(updateDebugInfo, 100)
    return () => clearInterval(interval)
  }, [])

  // Only show debug in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    window.location.reload()
  }

  return (
    <>
      {/* Debug toggle button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Toggle Theme Debug"
      >
        {isDarkMode ? '🌙' : '☀️'}
      </button>

      {/* Quick toggle button */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Toggle Theme"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* Debug panel */}
      {showDebug && (
        <div className="fixed bottom-16 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border text-xs max-w-xs z-50">
          <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Theme Debug</h3>
          <div className="space-y-1 text-gray-700 dark:text-gray-300">
            <div>State: {isDarkMode ? '🌙 Dark' : '☀️ Light'}</div>
            <div>HTML Class: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{htmlClass || 'none'}</code></div>
            <div>LocalStorage: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{localStorageTheme}</code></div>
            <div className="pt-2">
              <button 
                onClick={() => {
                  const newTheme = isDarkMode ? 'light' : 'dark'
                  localStorage.setItem('theme', newTheme)
                  window.location.reload()
                }}
                className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
              >
                Force Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 