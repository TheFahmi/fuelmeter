'use client'

import { Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} FuelMeter. All rights reserved.
            </p>
          </div>
          
          {/* Made with love */}
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Made with
            </p>
            <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              in Indonesia
            </p>
          </div>
          
          {/* Links */}
          <div className="flex items-center space-x-4">
            {/* Empty for now */}
          </div>
        </div>
      </div>
    </footer>
  )
} 