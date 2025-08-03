'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Fuel, BarChart3, Plus, Target, TrendingUp, Shield, Zap, Globe } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      router.push('/dashboard')
    } else {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-white/80">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Fuel className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">🚗 FuelMeter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <button className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white hover:bg-white/20 transition-all duration-300 font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">
              ⛽ Track Your Fuel Consumption
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Monitor your vehicle&apos;s fuel efficiency, calculate costs per kilometer, and gain insights into your driving patterns with our comprehensive fuel tracking app.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/register">
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 w-full sm:w-auto">
                  <Plus className="h-5 w-5" />
                  <span>✨ Get Started Free</span>
                </button>
              </Link>
              <Link href="/login">
                <button className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-8 py-4 text-white hover:bg-white/20 transition-all duration-300 font-semibold w-full sm:w-auto">
                  🔑 Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500/20 mb-6">
              <Fuel className="h-8 w-8 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">⛽ Fuel Tracking</h3>
            <p className="text-white/70 leading-relaxed">
              Easily record fuel purchases with automatic cost calculations and odometer tracking.
            </p>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-500/20 mb-6">
              <BarChart3 className="h-8 w-8 text-green-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">📊 Smart Analytics</h3>
            <p className="text-white/70 leading-relaxed">
              Get detailed insights into your fuel consumption patterns and cost per kilometer.
            </p>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-500/20 mb-6">
              <Target className="h-8 w-8 text-purple-300" />
            <h3 className="text-xl font-bold text-white mb-4">🎯 Cost Optimization</h3>
            <p className="text-white/70 leading-relaxed">
              Identify the most cost-effective fuel stations and optimize your driving habits.
            </p>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-orange-500/20 mb-6">
              <TrendingUp className="h-8 w-8 text-orange-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">📈 Performance Tracking</h3>
            <p className="text-white/70 leading-relaxed">
              Monitor your vehicle&apos;s performance over time with comprehensive statistics.
            </p>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-500/20 mb-6">
              <Shield className="h-8 w-8 text-red-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">🔒 Secure & Private</h3>
            <p className="text-white/70 leading-relaxed">
              Your data is securely stored and protected with enterprise-grade security.
            </p>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-yellow-500/20 mb-6">
              <Zap className="h-8 w-8 text-yellow-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">⚡ Real-time Sync</h3>
            <p className="text-white/70 leading-relaxed">
              Access your data anywhere with cloud synchronization across all devices.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-12 shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-6">
            🚀 Ready to Start Tracking?
          </h3>
          <p className="text-white/80 mb-8 text-lg">
            Join thousands of users who are already optimizing their fuel consumption.
          </p>
          <Link href="/register">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto">
              <Globe className="h-5 w-5" />
              <span>🌟 Create Free Account</span>
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="backdrop-blur-md bg-white/10 border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-white/70">
              © 2024 FuelMeter. Made with ❤️ in Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
