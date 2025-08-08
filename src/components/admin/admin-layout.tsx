'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  Crown, 
  Menu, 
  X,
  LogOut,
  Shield,
  Database,
  CreditCard
} from 'lucide-react'
import { useAdmin } from '@/contexts/admin-context'
import { Button } from '@/components/ui/button'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'User Settings', href: '/admin/user-settings', icon: Settings },
  { name: 'Fuel Records', href: '/admin/records', icon: FileText },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Premium', href: '/admin/premium', icon: Crown },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Database', href: '/admin/database', icon: Database },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { adminData, logout } = useAdmin()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* glassmorphism background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_10%_10%,rgba(59,130,246,0.08),transparent_60%),radial-gradient(60%_60%_at_90%_10%,rgba(147,51,234,0.08),transparent_60%)]" />
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col backdrop-blur-xl bg-white/70 dark:bg-white/10 border-r border-black/10 dark:border-white/10 shadow-2xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-600 dark:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {adminData?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {adminData?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow backdrop-blur-xl bg-white/70 dark:bg-white/10 border-r border-black/10 dark:border-white/10">
          <div className="flex h-16 items-center px-4 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">Admin Panel</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-600 dark:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-black/10 dark:border-white/10 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600/90 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {adminData?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {adminData?.email}
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400">Administrator</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 backdrop-blur-xl bg-white/70 dark:bg-white/10 border-b border-black/10 dark:border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-slate-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4 lg:px-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                FuelMeter Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600 dark:text-gray-400">
                Welcome back, {adminData?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-screen">
          <div className="py-6">
            <div className="mx-4 md:mx-6 lg:mx-8">
              <div className="rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-xl p-4 md:p-6 lg:p-8">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
