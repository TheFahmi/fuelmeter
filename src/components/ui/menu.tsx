'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Home, Plus, BarChart3, Settings, LogOut, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface BurgerMenuProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function BurgerMenu({ isDarkMode, onToggleDarkMode }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'Tambah Catatan',
      href: '/dashboard/add-record',
      icon: Plus
    },
    {
      name: 'Semua Catatan',
      href: '/dashboard/records',
      icon: BarChart3
    },
    {
      name: 'Statistik',
      href: '/dashboard/statistics',
      icon: BarChart3
    }
  ]

  return (
    <div className="relative">
      {/* Menu Button */}
      <button
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true)
            setIsAnimating(true)
          } else {
            setIsAnimating(false)
            setTimeout(() => setIsOpen(false), 300)
          }
        }}
        className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
            onClick={() => {
              setIsAnimating(false)
              setTimeout(() => setIsOpen(false), 300)
            }}
          />
          
          {/* Menu Panel */}
          <div className={`absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-out ${
            isAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Menu
              </h2>
              <button
                onClick={() => {
                  setIsAnimating(false)
                  setTimeout(() => setIsOpen(false), 300)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      setIsAnimating(false)
                      setTimeout(() => setIsOpen(false), 300)
                    }}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Divider */}
            <div className="my-6 border-t border-gray-200 dark:border-gray-600" />

            {/* Settings */}
            <div className="space-y-2">
              <button
                onClick={onToggleDarkMode}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
} 