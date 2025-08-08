'use client'

import { useEffect } from 'react'

export function ThemeEnforcer() {
  useEffect(() => {
    const enforce = () => {
      try {
        const saved = localStorage.getItem('theme')
        const root = document.documentElement
        const shouldDark = saved === 'dark'
        if (shouldDark) {
          if (!root.classList.contains('dark')) {
            root.classList.add('dark')
            root.style.colorScheme = 'dark'
          }
        } else {
          if (root.classList.contains('dark')) {
            root.classList.remove('dark')
            root.style.colorScheme = 'light'
          }
        }
      } catch {}
    }

    enforce()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') enforce()
    }
    const onVisibility = () => enforce()
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}


