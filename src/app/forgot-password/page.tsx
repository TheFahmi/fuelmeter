'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Fuel, Mail, ArrowLeft, CheckCircle, Clock, Shield } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/contexts/toast-context'
import { forgotPasswordLimiter, getClientIdentifier, formatRemainingTime } from '@/lib/rate-limit'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<number | null>(null)
  const [rateLimitStatus, setRateLimitStatus] = useState<{ attempts: number; remainingAttempts: number; resetTime?: number } | null>(null)
  const supabase = createClient()
  const toast = useToast()

  // Check rate limit status on component mount and email change
  useEffect(() => {
    if (email) {
      const status = forgotPasswordLimiter.getStatus(email, 'forgot-password')
      setRateLimitStatus(status)
    } else {
      setRateLimitStatus(null)
    }
  }, [email])

  // Development utility - expose functions to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // @ts-expect-error - Adding debug functions to window for development
      window.clearRateLimits = async () => {
        const { clearAllRateLimits } = await import('@/lib/rate-limit')
        clearAllRateLimits()
        console.log('All rate limits cleared!')
        // Refresh status
        if (email) {
          const status = forgotPasswordLimiter.getStatus(email, 'forgot-password')
          setRateLimitStatus(status)
        }
      }
      // @ts-expect-error - Adding debug functions to window for development
      window.getRateLimitStatus = async () => {
        const { getAllRateLimitStatuses } = await import('@/lib/rate-limit')
        console.table(getAllRateLimitStatuses())
      }
    }
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Check rate limiting
    const clientId = getClientIdentifier()
    const rateLimitResult = forgotPasswordLimiter.isAllowed(email || clientId, 'forgot-password')

    if (!rateLimitResult.allowed) {
      const remainingTime = forgotPasswordLimiter.getRemainingTime(email || clientId, 'forgot-password')
      const timeStr = remainingTime ? formatRemainingTime(remainingTime) : 'some time'

      setMessage(`Too many attempts. Please try again in ${timeStr}.`)
      toast.warning(
        'Rate Limit Exceeded',
        `Please wait ${timeStr} before trying again.`
      )
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
      setLastSentTime(Date.now())
      setMessage('Password reset link sent to your email!')

      toast.success(
        'Email Sent Successfully!',
        'Please check your inbox for the password reset link.'
      )
    } catch (error) {
      console.error('Reset password error:', error)
      const errorMessage = 'Failed to send reset email. Please try again.'
      setMessage(errorMessage)
      toast.error('Failed to Send Email', errorMessage)
    } finally {
      setLoading(false)
      // Update rate limit status
      if (email) {
        const status = forgotPasswordLimiter.getStatus(email, 'forgot-password')
        setRateLimitStatus(status)
      }
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.warning('Email Required', 'Please enter your email address first.')
      return
    }

    // Check if enough time has passed (60 seconds)
    if (lastSentTime && Date.now() - lastSentTime < 60000) {
      const remainingSeconds = Math.ceil((60000 - (Date.now() - lastSentTime)) / 1000)
      toast.info('Please Wait', `You can resend in ${remainingSeconds} seconds.`)
      return
    }

    await handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
            Reset your password
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
              🔑 Forgot Password
            </h2>
            
            {success ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                    ✅ Email Sent Successfully!
                  </h3>
                  <p className="text-black/70 dark:text-white/70 mb-4">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
                  </p>
                  <div className="backdrop-blur-md bg-blue-500/10 border border-blue-300/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-sm">
                      <Shield className="h-4 w-4" />
                      <span>Check your spam folder if you don&apos;t see the email</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleResend}
                    disabled={loading || Boolean(lastSentTime && Date.now() - lastSentTime < 60000)}
                    className="w-full backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-xl px-6 py-3 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>
                          {lastSentTime && Date.now() - lastSentTime < 60000
                            ? `Resend in ${Math.ceil((60000 - (Date.now() - lastSentTime)) / 1000)}s`
                            : 'Resend Email'
                          }
                        </span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black/80 dark:text-white/80 mb-2">
                    📧 Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black/50 dark:text-white/50" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="pl-12 backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 rounded-xl py-3"
                      required
                    />
                  </div>
                </div>

                {message && (
                  <div className={`text-sm p-4 rounded-xl backdrop-blur-sm ${
                    success 
                      ? 'text-green-600 dark:text-green-300 bg-green-500/20 border border-green-600/30 dark:border-green-300/30'
                      : 'text-red-600 dark:text-red-300 bg-red-500/20 border border-red-600/30 dark:border-red-300/30'
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
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>📧 Send Reset Link</span>
                  )}
                </button>

                {/* Rate Limiting Info */}
                <div className="space-y-3">
                  <div className="backdrop-blur-md bg-yellow-500/10 border border-yellow-300/30 rounded-xl p-4">
                    <div className="flex items-start space-x-2 text-yellow-600 dark:text-yellow-400 text-sm">
                      <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Rate Limiting Active</p>
                        <p className="text-xs mt-1">
                          Limited to 3 attempts per 15 minutes for security. If you exceed this limit, you&apos;ll need to wait 30 minutes.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  {rateLimitStatus && email && (
                    <div className={`backdrop-blur-md border rounded-xl p-3 text-sm ${
                      rateLimitStatus.resetTime && Date.now() < rateLimitStatus.resetTime
                        ? 'bg-red-500/10 border-red-300/30 text-red-600 dark:text-red-400'
                        : rateLimitStatus.remainingAttempts <= 1
                        ? 'bg-orange-500/10 border-orange-300/30 text-orange-600 dark:text-orange-400'
                        : 'bg-blue-500/10 border-blue-300/30 text-blue-600 dark:text-blue-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span>
                          {rateLimitStatus.resetTime && Date.now() < rateLimitStatus.resetTime
                            ? `🚫 Blocked for ${formatRemainingTime(rateLimitStatus.resetTime - Date.now())}`
                            : `📊 ${rateLimitStatus.remainingAttempts} attempts remaining`
                          }
                        </span>
                        <span className="text-xs opacity-75">
                          Used: {rateLimitStatus.attempts}/3
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-black/70 dark:text-white/70">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 