import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats Indonesian license plate from lowercase input to proper format
 * Example: "b4297bhx" -> "B 4297 BHX"
 * @param input - The raw license plate input
 * @returns Formatted license plate string
 */
export function formatLicensePlate(input: string): string {
 * Formats Indonesian license plate from lowercase input to proper format.
 * Example: "b4297bhx" -> "B 4297 BHX"
 * 
 * @param input - The raw license plate input. If input is null, undefined, or not a string, returns an empty string.
 *                If input is a very short string (less than 5 characters), returns the cleaned (uppercased, no spaces) input.
 *                For very long strings, only the first 8 characters are considered for formatting; the rest are ignored.
 * @returns Formatted license plate string, or cleaned input if no pattern matches, or empty string for invalid input.
 */
export function formatLicensePlate(input: string): string {
  if (typeof input !== 'string' || !input) return ''
  
  // Remove all spaces and convert to uppercase
  const cleaned = input.replace(/\s/g, '').toUpperCase()
  
  // Handle different license plate formats
  if (cleaned.length >= 7) {
    // Format: B 4297 BHX (1 letter + 4 numbers + 3 letters)
    const areaCode = cleaned.charAt(0)
    const numbers = cleaned.slice(1, 5)
    const letters = cleaned.slice(5, 8)
    
    // Validate that we have the right pattern
    if (/^[A-Z]$/.test(areaCode) && /^\d{4}$/.test(numbers) && /^[A-Z]{3}$/.test(letters)) {
      return `${areaCode} ${numbers} ${letters}`
    }
  }
  
  if (cleaned.length >= 6) {
    // Format: B 4297 BH (1 letter + 4 numbers + 2 letters)
    const areaCode = cleaned.charAt(0)
    const numbers = cleaned.slice(1, 5)
    const letters = cleaned.slice(5, 7)
    
    if (/^[A-Z]$/.test(areaCode) && /^\d{4}$/.test(numbers) && /^[A-Z]{2}$/.test(letters)) {
      return `${areaCode} ${numbers} ${letters}`
    }
  }
  
  if (cleaned.length >= 5) {
    // Format: B 4297 B (1 letter + 4 numbers + 1 letter)
    const areaCode = cleaned.charAt(0)
    const numbers = cleaned.slice(1, 5)
    const letter = cleaned.slice(5, 6)
    
    if (/^[A-Z]$/.test(areaCode) && /^\d{4}$/.test(numbers) && /^[A-Z]$/.test(letter)) {
      return `${areaCode} ${numbers} ${letter}`
    }
  }
  
  // If no specific pattern matches, just return the cleaned input
  return cleaned
} 