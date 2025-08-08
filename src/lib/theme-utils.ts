// Theme utility functions for consistent glassmorphism styling

export const themeClasses = {
  // Background gradients
  background: "bg-white dark:bg-slate-950",
  
  // Glass containers
  glass: "backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20",
  glassHover: "hover:bg-black/20 dark:hover:bg-white/20",
  
  // Text colors
  text: "text-black dark:text-white",
  textMuted: "text-black/70 dark:text-white/70",
  textSubtle: "text-black/60 dark:text-white/60",
  
  // Input fields
  input: "backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50",
  
  // Buttons
  buttonSecondary: "backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20",
  
  // Cards
  card: "backdrop-blur-md bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl hover:bg-black/15 dark:hover:bg-white/15",
  
  // Menu/Navigation
  menu: "backdrop-blur-xl bg-black/10 dark:bg-white/10 border-l border-black/20 dark:border-white/20",
  menuItem: "text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20",
  
  // Status colors
  success: "text-green-600 dark:text-green-300 bg-green-500/20 border-green-600/30 dark:border-green-300/30",
  error: "text-red-600 dark:text-red-300 bg-red-500/20 border-red-600/30 dark:border-red-300/30",
  warning: "text-yellow-600 dark:text-yellow-300 bg-yellow-500/20 border-yellow-600/30 dark:border-yellow-300/30",
  info: "text-blue-600 dark:text-blue-300 bg-blue-500/20 border-blue-600/30 dark:border-blue-300/30",
}

// Utility function to combine theme classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Get theme-aware glassmorphism classes
export function getGlassClasses(variant: 'default' | 'hover' | 'card' | 'input' | 'button' = 'default'): string {
  const base = themeClasses.glass
  
  switch (variant) {
    case 'hover':
      return cn(base, themeClasses.glassHover)
    case 'card':
      return themeClasses.card
    case 'input':
      return themeClasses.input
    case 'button':
      return themeClasses.buttonSecondary
    default:
      return base
  }
}

// Get theme-aware text classes
export function getTextClasses(variant: 'default' | 'muted' | 'subtle' = 'default'): string {
  switch (variant) {
    case 'muted':
      return themeClasses.textMuted
    case 'subtle':
      return themeClasses.textSubtle
    default:
      return themeClasses.text
  }
}
