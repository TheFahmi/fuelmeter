'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Home, Plus, BarChart3, User, LogOut, Sun, Moon, Crown, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/contexts/theme-context'
import { usePremium } from '@/contexts/premium-context'
import { PremiumBadge } from '@/components/premium/premium-badge'

export function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { isPremium, loading: premiumLoading } = usePremium()

  const handleLogout = async () => {
    // Clear remember me data
    localStorage.removeItem('fuelmeter_remember_me')
    localStorage.removeItem('fuelmeter_user_email')
    
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
    },
    {
      name: 'Premium',
      href: '/dashboard/premium',
      icon: Crown
    },
    {
      name: 'Manage Premium',
      href: '/dashboard/manage-premium',
      icon: Settings
    },
    {
      name: 'Profil',
      href: '/dashboard/profile',
      icon: User
    }
  ]

  return (
    <div className="fixed top-6 right-6 z-50">
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
        className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-full p-3 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-all duration-300 transform hover:scale-110 shadow-2xl"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>

      {/* Menu Overlay */}
      <div className={`fixed inset-0 z-40 menu-overlay transition-all duration-500 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 dark:bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setIsAnimating(false)
            setTimeout(() => setIsOpen(false), 300)
          }}
        />

        {/* Menu Panel */}
        <div className={`absolute right-0 top-0 h-full w-80 backdrop-blur-xl bg-black/10 dark:bg-white/10 border-l border-black/20 dark:border-white/20 shadow-2xl transform menu-panel transition-all duration-500 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-black dark:text-white">
                    🚗 FuelMeter
                  </h2>
                  {isPremium && !premiumLoading && <PremiumBadge variant="minimal" />}
                </div>
                <p className="text-xs text-black/60 dark:text-white/60">
                  {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAnimating(false)
                  setTimeout(() => setIsOpen(false), 300)
                }}
                className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-full p-2 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="space-y-3">
              {menuItems.map((item, index) => {
                const isActive = typeof window !== 'undefined' && (window.location.pathname === item.href || window.location.pathname.startsWith(item.href + '/'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setIsAnimating(false)
                      setTimeout(() => setIsOpen(false), 300)
                    }}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border ${
                      isActive
                        ? 'bg-blue-100/80 text-blue-700 border-blue-300 dark:bg-blue-500/10 dark:text-white dark:border-blue-400/30'
                        : 'text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                    {item.name === 'Premium' && !isPremium && (
                      <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                        Upgrade
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Settings */}
            <div className="mt-8 pt-6 border-t border-black/20 dark:border-white/20">
              <div className="space-y-3">
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center space-x-4 px-4 py-3 rounded-xl text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 w-full"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="h-5 w-5" />
                      <span className="font-medium">☀️ Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5" />
                      <span className="font-medium">🌙 Dark Mode</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-4 px-4 py-3 rounded-xl text-red-600 dark:text-red-300 hover:bg-red-500/20 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-red-600/20 dark:border-red-300/20 hover:border-red-600/40 dark:hover:border-red-300/40 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">🚪 Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 