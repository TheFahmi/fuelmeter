'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Home, Plus, BarChart3, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export function BurgerMenu() {
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
        className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full p-3 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-110 shadow-2xl"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>

      {/* Menu Overlay */}
      <div className={`fixed inset-0 z-40 menu-overlay transition-all duration-500 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setIsAnimating(false)
            setTimeout(() => setIsOpen(false), 300)
          }}
        />

        {/* Menu Panel */}
        <div className={`absolute right-0 top-0 h-full w-80 backdrop-blur-xl bg-white/10 border-l border-white/20 shadow-2xl transform menu-panel transition-all duration-500 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">
                🚗 FuelMeter
              </h2>
              <button
                onClick={() => {
                  setIsAnimating(false)
                  setTimeout(() => setIsOpen(false), 300)
                }}
                className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full p-2 text-white hover:bg-white/20 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="space-y-3">
              {menuItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setIsAnimating(false)
                    setTimeout(() => setIsOpen(false), 300)
                  }}
                  className="flex items-center space-x-4 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/10 hover:border-white/20"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Settings */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="space-y-3">
                <div className="flex items-center space-x-4 px-4 py-3 rounded-xl text-white/60 backdrop-blur-sm border border-white/10">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                  <span className="font-medium">🌙 Dark Mode Only</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-4 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-red-300/20 hover:border-red-300/40 w-full"
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