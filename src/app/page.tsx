'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Fuel, BarChart3, Plus, Target, TrendingUp, Shield, Zap, Users, Star, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-black/80 dark:text-white/80">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Top Navigation (Footer is provided globally in layout, not here) */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-slate-950/60 border-b border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Fuel className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-black dark:text-white">FuelMeter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <button className="backdrop-blur-md bg-white/50 dark:bg-white/10 border border-black/10 dark:border-white/15 rounded-xl px-4 py-2 text-black dark:text-white hover:bg-white/70 dark:hover:bg-white/15 transition-all duration-300 font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="backdrop-blur-md bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-3xl p-12 shadow-2xl mb-12">
            <h2 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
              Track fuel. Save money. Drive smarter.
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Pantau konsumsi BBM, biaya per km, dan insight berkendara—semua dalam satu aplikasi sederhana.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/register">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 w-full sm:w-auto">
                  <Plus className="h-5 w-5" />
                  <span>Mulai Gratis</span>
                </button>
              </Link>
              <Link href="/login">
                <button className="backdrop-blur-md bg-white/50 dark:bg-white/10 border border-black/10 dark:border-white/15 rounded-xl px-8 py-4 text-black dark:text-white hover:bg-white/70 dark:hover:bg-white/15 transition-all duration-300 font-semibold w-full sm:w-auto">
                  Masuk
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/15 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500/20 mb-6">
              <Fuel className="h-8 w-8 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">⛽ Fuel Tracking</h3>
            <p className="text-slate-700 dark:text-white/70 leading-relaxed">
              Easily record fuel purchases with automatic cost calculations and odometer tracking.
            </p>
          </div>

          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/15 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-500/20 mb-6">
              <BarChart3 className="h-8 w-8 text-green-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">📊 Smart Analytics</h3>
            <p className="text-slate-700 dark:text-white/70 leading-relaxed">
              Get detailed insights into your fuel consumption patterns and cost per kilometer.
            </p>
          </div>

          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/15 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-500/20 mb-6">
              <Target className="h-8 w-8 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🎯 Cost Optimization</h3>
            <p className="text-slate-700 dark:text-white/70 leading-relaxed">
              Identify the most cost-effective fuel stations and optimize your driving habits.
            </p>
          </div>

          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/15 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-orange-500/20 mb-6">
              <TrendingUp className="h-8 w-8 text-orange-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">📈 Performance Tracking</h3>
            <p className="text-slate-700 dark:text-white/70 leading-relaxed">
              Monitor your vehicle&apos;s performance over time with comprehensive statistics.
            </p>
          </div>

          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/15 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-500/20 mb-6">
              <Shield className="h-8 w-8 text-red-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🔒 Secure & Private</h3>
            <p className="text-slate-700 dark:text-white/70 leading-relaxed">
              Your data is securely stored and protected with enterprise-grade security.
            </p>
          </div>

          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-black/15 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-yellow-500/20 mb-6">
              <Zap className="h-8 w-8 text-yellow-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">⚡ Real-time Sync</h3>
            <p className="text-slate-700 dark:text-white/70 leading-relaxed">
              Access your data anywhere with cloud synchronization across all devices.
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="text-center mb-16">
          <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-8">
              📊 Trusted by Fuel Enthusiasts
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">1,000+</div>
                <div className="text-black/70 dark:text-white/70">
                  <Users className="h-5 w-5 mx-auto mb-1" />
                  Active Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">50K+</div>
                <div className="text-black/70 dark:text-white/70">
                  <Fuel className="h-5 w-5 mx-auto mb-1" />
                  Records Tracked
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">Rp2M+</div>
                <div className="text-black/70 dark:text-white/70">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1" />
                  Money Saved
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">4.9★</div>
                <div className="text-black/70 dark:text-white/70">
                  <Star className="h-5 w-5 mx-auto mb-1" />
                  User Rating
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-black dark:text-white text-center mb-8">
            💬 What Our Users Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
              <p className="text-black/80 dark:text-white/80 mb-4">
                &quot;FuelMeter helped me save 20% on fuel costs by tracking my consumption patterns. Amazing app!&quot;
              </p>
              <div className="text-black/60 dark:text-white/60 text-sm">
                - Ahmad, Jakarta
              </div>
            </div>

            <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
              <p className="text-black/80 dark:text-white/80 mb-4">
                &quot;Simple, elegant, and powerful. The analytics feature gives me insights I never had before.&quot;
              </p>
              <div className="text-black/60 dark:text-white/60 text-sm">
                - Sari, Surabaya
              </div>
            </div>

            <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
              <p className="text-black/80 dark:text-white/80 mb-4">
                &quot;Perfect for fleet management. We track all our vehicles efficiently with this tool.&quot;
              </p>
              <div className="text-black/60 dark:text-white/60 text-sm">
                - Budi, Bandung
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-black dark:text-white text-center mb-8">
            ❓ Frequently Asked Questions
          </h3>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
              <h4 className="text-lg font-semibold text-black dark:text-white mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Is FuelMeter free to use?
              </h4>
              <p className="text-black/70 dark:text-white/70">
                Yes! FuelMeter is completely free to use. You can track unlimited fuel records, view analytics, and access all features without any cost.
              </p>
            </div>

            <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
              <h4 className="text-lg font-semibold text-black dark:text-white mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                How secure is my data?
              </h4>
              <p className="text-black/70 dark:text-white/70">
                Your data is protected with enterprise-grade security. We use encryption and secure servers to ensure your fuel records are safe and private.
              </p>
            </div>

            <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl p-6 shadow-2xl">
              <h4 className="text-lg font-semibold text-black dark:text-white mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Can I export my data?
              </h4>
              <p className="text-black/70 dark:text-white/70">
                Absolutely! You can export your fuel records in various formats including CSV and PDF for your personal records or tax purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center backdrop-blur-md bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-300/30 dark:border-purple-300/30 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-3xl"></div>
          <div className="absolute top-4 right-4">
            <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Sparkles className="h-6 w-6 text-blue-400 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            <h3 className="text-4xl font-bold text-black dark:text-white mb-4">
              🚀 Ready to Start Saving?
            </h3>
            <p className="text-xl text-black/80 dark:text-white/80 mb-6 max-w-2xl mx-auto">
              Join thousands of smart drivers who are already optimizing their fuel consumption and saving money!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <div className="flex items-center space-x-2 text-black/70 dark:text-white/70">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center space-x-2 text-black/70 dark:text-white/70">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center space-x-2 text-black/70 dark:text-white/70">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Setup in 2 Minutes</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2">
                  <Sparkles className="h-6 w-6" />
                  <span>Start Tracking Now</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>

              <Link href="/login">
                <button className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-xl px-10 py-4 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-all duration-300 font-semibold text-lg flex items-center justify-center space-x-2">
                  <span>I Have an Account</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
