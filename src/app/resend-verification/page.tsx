'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Fuel, Mail, ArrowLeft, CheckCircle, Clock, Shield, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/contexts/toast-context'
import { resendVerificationLimiter, getClientIdentifier, formatRemainingTime } from '@/lib/rate-limit'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<number | null>(null)
  const [, setRateLimitStatus] = useState<{ attempts: number; remainingAttempts: number; resetTime?: number } | null>(null)
  const supabase = createClient()
  const toast = useToast()

  // Check rate limit status on component mount and email change
  useEffect(() => {
    if (email) {
      const status = resendVerificationLimiter.getStatus(email, 'resend-verification')
      setRateLimitStatus(status)
    } else {
      setRateLimitStatus(null)
    }
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Check rate limiting
    const clientId = getClientIdentifier()
    const rateLimitResult = resendVerificationLimiter.isAllowed(email || clientId, 'resend-verification')

    if (!rateLimitResult.allowed) {
      const remainingTime = resendVerificationLimiter.getRemainingTime(email || clientId, 'resend-verification')
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      setSuccess(true)
      setLastSentTime(Date.now())
      setMessage('Verification email sent successfully!')
      
      toast.success(
        'Verification Email Sent!',
        'Please check your inbox for the verification link.'
      )
    } catch (error) {
      console.error('Resend verification error:', error)
      const errorMessage = 'Failed to send verification email. Please try again.'
      setMessage(errorMessage)
      toast.error('Failed to Send Email', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.warning('Email Required', 'Please enter your email address first.')
      return
    }

    // Check if enough time has passed (30 seconds)
    if (lastSentTime && Date.now() - lastSentTime < 30000) {
      const remainingSeconds = Math.ceil((30000 - (Date.now() - lastSentTime)) / 1000)
      toast.info('Please Wait', `You can resend in ${remainingSeconds} seconds.`)
      return
    }

    await handleSubmit({ preventDefault: () => {} } as React.FormEvent)
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
            Resend email verification
          </p>
        </div>

        {/* Form Container */}
        <div className="backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
              📧 Resend Verification
            </h2>
            
            {success ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                    ✅ Verification Email Sent!
                  </h3>
                  <p className="text-black/70 dark:text-white/70 mb-4">
                    We&apos;ve sent a new verification link to <strong>{email}</strong>. Please check your inbox and click the verification link.
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
                    disabled={loading || (lastSentTime && Date.now() - lastSentTime < 30000)}
                    className="w-full backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-xl px-6 py-3 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>
                          {lastSentTime && Date.now() - lastSentTime < 30000
                            ? `Resend in ${Math.ceil((30000 - (Date.now() - lastSentTime)) / 1000)}s`
                            : 'Resend Verification'
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
                    <span>📧 Send Verification Email</span>
                  )}
                </button>
                
                {/* Rate Limiting Info */}
                <div className="backdrop-blur-md bg-yellow-500/10 border border-yellow-300/30 rounded-xl p-4">
                  <div className="flex items-start space-x-2 text-yellow-600 dark:text-yellow-400 text-sm">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Rate Limiting Active</p>
                      <p className="text-xs mt-1">
                        Limited to 5 attempts per 10 minutes for security. If you exceed this limit, you&apos;ll need to wait 20 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-black/70 dark:text-white/70">
                Already verified?{' '}
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
