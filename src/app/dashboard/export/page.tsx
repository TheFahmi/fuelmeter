'use client'

import { PremiumGuard } from '@/components/premium/premium-guard'
import { PDFExport } from '@/components/pdf-export'

export default function ExportPage() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Export & Reports</h1>
        <p className="text-slate-600 dark:text-slate-300">Generate and download your reports.</p>
      </div>
      <PremiumGuard feature="PDF Export">
        <PDFExport />
      </PremiumGuard>
    </div>
  )
}


