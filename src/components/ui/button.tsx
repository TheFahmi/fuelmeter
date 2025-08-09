import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            // Light mode (no dark hover)
            'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500 dark:hover:bg-blue-700': variant === 'default' || variant === 'primary',
            'bg-gray-200 text-slate-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus-visible:ring-gray-500': variant === 'secondary',
            'border border-gray-300 bg-white text-slate-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-transparent dark:text-white dark:hover:bg-gray-700 focus-visible:ring-gray-500': variant === 'outline',
            'text-slate-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 focus-visible:ring-gray-500': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-500 dark:hover:bg-red-700 focus-visible:ring-red-500': variant === 'destructive',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button } 