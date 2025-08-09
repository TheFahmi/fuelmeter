'use client'

import { Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="backdrop-blur-md bg-white/80 dark:bg-white/10 border-t border-black/10 dark:border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-slate-700 dark:text-white/70">
              © {currentYear} FuelMeter. All rights reserved.
            </p>
          </div>
          
          {/* Made with love */}
          <div className="flex items-center space-x-2">
            <p className="text-sm text-slate-700 dark:text-white/70">Made with</p>
            <Heart className="h-4 w-4 text-red-500" />
            <p className="text-sm text-slate-700 dark:text-white/70">in Indonesia</p>
          </div>
          
          {/* Links */}
          <div className="flex items-center space-x-4">
            {/* reserved for future links */}
          </div>
        </div>
      </div>
    </footer>
  )
}