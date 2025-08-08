'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Fuel, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/contexts/toast-context'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

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

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      if (data.user) {
        const successMessage = 'Registration successful! Please check your email to verify your account.'
        setMessage(successMessage)

        toast.addToast({
          type: 'success',
          title: 'Account Created Successfully!',
          message: 'Please check your email for verification link.',
          action: {
            label: 'Resend Email',
            onClick: () => router.push('/resend-verification')
          }
        })

        setTimeout(() => {
          router.push('/login')
        }, 5000)
      }
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = 'Registration failed. Please try again.'
      setMessage(errorMessage)
      toast.error('Registration Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl">
              <Fuel className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            🚗 FuelMeter
          </h1>
          <p className="text-white/70 text-lg">
            Create your account
          </p>
        </div>

        {/* Register Form */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              ✨ Sign Up
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white/80 mb-2">
                  📧 Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-white/50" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-12 backdrop-blur-sm bg-white/40 dark:bg-white/10 border border-black/10 dark:border-white/15 text-black dark:text-white placeholder-slate-500 dark:placeholder-white/50 rounded-xl py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white/80 mb-2">
                  🔒 Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-white/50" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-12 pr-12 backdrop-blur-sm bg-white/40 dark:bg-white/10 border border-black/10 dark:border-white/15 text-black dark:text-white placeholder-slate-500 dark:placeholder-white/50 rounded-xl py-3"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white/80 mb-2">
                  🔐 Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-white/50" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-12 pr-12 backdrop-blur-sm bg-white/40 dark:bg-white/10 border border-black/10 dark:border-white/15 text-black dark:text-white placeholder-slate-500 dark:placeholder-white/50 rounded-xl py-3"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`text-sm p-4 rounded-xl backdrop-blur-sm border ${
                  message.includes('successful')
                    ? 'text-green-700 dark:text-green-300 bg-green-500/15 border-green-600/25 dark:border-green-300/25'
                    : 'text-red-700 dark:text-red-300 bg-red-500/15 border-red-600/25 dark:border-red-300/25'
                }`}>
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
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>🚀 Sign Up</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-white/70">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}