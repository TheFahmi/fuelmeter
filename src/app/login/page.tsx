'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Fuel, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      router.push('/dashboard')
    }
  }, [supabase, router])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setMessage('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl">
              <Fuel className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            🚗 FuelMeter
          </h1>
          <p className="text-black/70 dark:text-white/70 text-lg">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
              🔑 Sign In
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black/80 dark:text-white/80 mb-2">
                  📧 Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black/50 dark:text-white/50" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-12 backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 rounded-xl py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black/80 dark:text-white/80 mb-2">
                  🔒 Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black/50 dark:text-white/50" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-12 pr-12 backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 rounded-xl py-3"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {message && (
                <div className="text-sm text-red-600 dark:text-red-300 bg-red-500/20 border border-red-600/30 dark:border-red-300/30 p-4 rounded-xl backdrop-blur-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>✨ Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-black/70 dark:text-white/70">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}