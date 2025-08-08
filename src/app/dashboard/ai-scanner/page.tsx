'use client'

import { PremiumGuard } from '@/components/premium/premium-guard'
import { ReceiptScanner } from '@/components/receipt-scanner'

export default function AIScannerPage() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Receipt Scanner</h1>
        <p className="text-slate-600 dark:text-slate-300">Scan and extract receipt data with AI.</p>
      </div>
      <PremiumGuard feature="AI Receipt Scanner">
        <ReceiptScanner />
      </PremiumGuard>
    </div>
  )
}


