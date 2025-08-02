'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Fuel, BarChart3, Target, TrendingUp, Shield, Zap, Globe, ArrowRight, Star, Users, Sparkles } from 'lucide-react'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="spinner-modern mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
                <Fuel className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">FuelMeter</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="nav-link">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="btn-primary-modern">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
                Smart Fuel
                <span className="text-gradient block">Tracking</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Track your fuel consumption, optimize costs, and reduce your carbon footprint with our intelligent fuel management platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button className="btn-primary-modern text-lg px-8 py-4">
                    Start Tracking Now
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" className="btn-secondary-modern text-lg px-8 py-4">
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-bounce-gentle"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose FuelMeter?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage your fuel consumption efficiently and make informed decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="card-modern hover-lift group">
              <CardContent className="p-8">
                <div className="stats-icon gradient-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Smart Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get detailed insights into your fuel consumption patterns with advanced analytics and visualizations.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="card-modern hover-lift group">
              <CardContent className="p-8">
                <div className="stats-icon gradient-success mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Budget Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Set monthly budgets and track your spending to stay on top of your fuel costs.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="card-modern hover-lift group">
              <CardContent className="p-8">
                <div className="stats-icon gradient-secondary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Performance Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Monitor your vehicle&apos;s efficiency and get recommendations to improve performance.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="card-modern hover-lift group">
              <CardContent className="p-8">
                <div className="stats-icon gradient-warning mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Secure & Private
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your data is encrypted and secure. We never share your personal information.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="card-modern hover-lift group">
              <CardContent className="p-8">
                <div className="stats-icon gradient-dark mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Real-time Sync
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Access your data anywhere, anytime with real-time synchronization across all devices.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="card-modern hover-lift group">
              <CardContent className="p-8">
                <div className="stats-icon gradient-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Carbon Footprint
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Track your environmental impact and get tips to reduce your carbon footprint.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="animate-slide-up">
              <div className="text-4xl font-bold text-gradient mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-bold text-gradient-success mb-2">1M+</div>
              <div className="text-gray-600 dark:text-gray-400">Records Tracked</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold text-gradient-warning mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="card-glass p-12">
            <CardContent>
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl">
                  <Star className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Join thousands of users who are already optimizing their fuel consumption with FuelMeter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button className="btn-primary-modern text-lg px-8 py-4">
                    Create Free Account
                    <Users className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="btn-secondary-modern text-lg px-8 py-4">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">FuelMeter</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <span>© 2024 FuelMeter. All rights reserved.</span>
              <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
