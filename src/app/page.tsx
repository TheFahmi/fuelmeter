'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">FuelMeter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Track Your Fuel Consumption
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Monitor your vehicle&apos;s fuel efficiency, calculate costs per kilometer, and gain insights into your driving patterns with our comprehensive fuel tracking app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 mb-4">
                <Fuel className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Fuel Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Easily record fuel purchases with automatic cost calculations and odometer tracking.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20 mb-4">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Smart Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Get detailed insights into your fuel consumption patterns and cost per kilometer.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20 mb-4">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Cost Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Identify the most cost-effective fuel stations and optimize your driving habits.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20 mb-4">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Performance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor your vehicle&apos;s performance over time with comprehensive statistics.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 mb-4">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is securely stored and protected with enterprise-grade security.
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20 mb-4">
                <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Real-time Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Access your data anywhere with cloud synchronization across all devices.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Tracking?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Join thousands of users who are already optimizing their fuel consumption.
          </p>
          <Link href="/register">
            <Button size="lg">
              <Globe className="h-5 w-5 mr-2" />
              Create Free Account
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              © 2024 FuelMeter. Made with ❤️ in Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
