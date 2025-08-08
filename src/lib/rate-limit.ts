// Rate limiting utility for client-side operations

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number // Time window in milliseconds
  blockDurationMs?: number // How long to block after exceeding limit
}

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  lastAttempt: number
  blockedUntil?: number
}

class RateLimiter {
  private config: RateLimitConfig
  private storagePrefix: string

  constructor(config: RateLimitConfig, storagePrefix: string = 'rate_limit') {
    this.config = {
      blockDurationMs: config.windowMs * 2, // Default block duration
      ...config
    }
    this.storagePrefix = storagePrefix
  }

  private getStorageKey(identifier: string, action: string): string {
    return `${this.storagePrefix}:${action}:${identifier}`
  }

  private getEntry(key: string): RateLimitEntry | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const entry = JSON.parse(stored) as RateLimitEntry

      // Check if entry is expired
      const now = Date.now()
      if (now - entry.firstAttempt > this.config.windowMs && (!entry.blockedUntil || now > entry.blockedUntil)) {
        localStorage.removeItem(key)
        return null
      }

      return entry
    } catch {
      // Error reading rate limit entry
      return null
    }
  }

  private setEntry(key: string, entry: RateLimitEntry): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // Error storing rate limit entry
    }
  }

  private removeEntry(key: string): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(key)
    } catch {
      // Error removing rate limit entry
    }
  }

  private cleanupExpiredEntries(): void {
    if (typeof window === 'undefined') return

    const now = Date.now()
    const keysToRemove: string[] = []

    // Check all localStorage keys that match our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.storagePrefix)) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const entry = JSON.parse(stored) as RateLimitEntry
            // Remove entries older than the window and not blocked
            if (now - entry.firstAttempt > this.config.windowMs && (!entry.blockedUntil || now > entry.blockedUntil)) {
              keysToRemove.push(key)
            }
          }
        } catch {
          // Remove invalid entries
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  isAllowed(identifier: string, action: string): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    this.cleanupExpiredEntries()

    const key = this.getStorageKey(identifier, action)
    const now = Date.now()
    const entry = this.getEntry(key)

    // If no entry exists, allow the request
    if (!entry) {
      const newEntry: RateLimitEntry = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      }
      this.setEntry(key, newEntry)
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1
      }
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.blockedUntil
      }
    }

    // Check if we're within the time window
    const timeElapsed = now - entry.firstAttempt
    if (timeElapsed > this.config.windowMs) {
      // Reset the window
      const newEntry: RateLimitEntry = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      }
      this.setEntry(key, newEntry)
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts - 1
      }
    }

    // Check if we've exceeded the limit
    if (entry.attempts >= this.config.maxAttempts) {
      // Block the user
      const blockedUntil = now + (this.config.blockDurationMs || this.config.windowMs)
      const blockedEntry: RateLimitEntry = {
        ...entry,
        blockedUntil
      }
      this.setEntry(key, blockedEntry)
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockedUntil
      }
    }

    // Increment attempts
    const updatedEntry: RateLimitEntry = {
      ...entry,
      attempts: entry.attempts + 1,
      lastAttempt: now
    }
    this.setEntry(key, updatedEntry)

    return {
      allowed: true,
      remainingAttempts: this.config.maxAttempts - updatedEntry.attempts
    }
  }

  getRemainingTime(identifier: string, action: string): number | null {
    const key = this.getStorageKey(identifier, action)
    const entry = this.getEntry(key)

    if (!entry) return null

    const now = Date.now()

    if (entry.blockedUntil && now < entry.blockedUntil) {
      return entry.blockedUntil - now
    }

    return null
  }

  reset(identifier: string, action: string): void {
    const key = this.getStorageKey(identifier, action)
    this.removeEntry(key)
  }

  // Method to get current status without affecting the rate limit
  getStatus(identifier: string, action: string): { attempts: number; remainingAttempts: number; blockedUntil?: number; resetTime?: number } {
    const key = this.getStorageKey(identifier, action)
    const entry = this.getEntry(key)
    const now = Date.now()

    if (!entry) {
      return {
        attempts: 0,
        remainingAttempts: this.config.maxAttempts
      }
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        attempts: entry.attempts,
        remainingAttempts: 0,
        blockedUntil: entry.blockedUntil,
        resetTime: entry.blockedUntil
      }
    }

    // Check if window has expired
    const timeElapsed = now - entry.firstAttempt
    if (timeElapsed > this.config.windowMs) {
      return {
        attempts: 0,
        remainingAttempts: this.config.maxAttempts
      }
    }

    return {
      attempts: entry.attempts,
      remainingAttempts: Math.max(0, this.config.maxAttempts - entry.attempts)
    }
  }
}

// Pre-configured rate limiters for different actions
export const forgotPasswordLimiter = new RateLimiter({
  maxAttempts: 3, // 3 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000 // Block for 30 minutes
}, 'fuelmeter_forgot_password')

export const resendVerificationLimiter = new RateLimiter({
  maxAttempts: 5, // 5 attempts
  windowMs: 10 * 60 * 1000, // 10 minutes
  blockDurationMs: 20 * 60 * 1000 // Block for 20 minutes
}, 'fuelmeter_resend_verification')

export const loginLimiter = new RateLimiter({
  maxAttempts: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000 // Block for 30 minutes
}, 'fuelmeter_login')

// Utility functions
export function formatRemainingTime(ms: number): string {
  const minutes = Math.ceil(ms / (1000 * 60))
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours !== 1 ? 's' : ''}`
}

export function getClientIdentifier(): string {
  // Use a combination of factors to identify the client
  // In a real app, you might want to use IP address from server-side
  if (typeof window === 'undefined') return 'server'
  return `${navigator.userAgent.slice(0, 50)}_${window.location.hostname}`
}

// Utility function to clear all rate limits (useful for development/testing)
export function clearAllRateLimits(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('fuelmeter_')) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))
  console.log(`Cleared ${keysToRemove.length} rate limit entries`)
}

// Utility function to get all current rate limit statuses
export function getAllRateLimitStatuses(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}

  const statuses: Record<string, unknown> = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('fuelmeter_')) {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const entry = JSON.parse(stored)
          statuses[key] = {
            ...entry,
            timeRemaining: entry.blockedUntil ? Math.max(0, entry.blockedUntil - Date.now()) : 0
          }
        }
      } catch {
        statuses[key] = { error: 'Invalid entry' }
      }
    }
  }

  return statuses
}
