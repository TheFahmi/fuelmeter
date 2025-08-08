'use client'

import { PremiumGuard } from '@/components/premium/premium-guard'
import { CarbonFootprint } from '@/components/carbon-footprint'

export default function CarbonPage() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Carbon Footprint</h1>
        <p className="text-slate-600 dark:text-slate-300">Track emissions from your trips.</p>
      </div>
      <PremiumGuard feature="Carbon Footprint Tracking">
        <CarbonFootprint />
      </PremiumGuard>
    </div>
  )
}


