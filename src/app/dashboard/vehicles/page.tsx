'use client'

import { PremiumGuard } from '@/components/premium/premium-guard'
import { VehicleManager } from '@/components/vehicle-manager'

export default function VehiclesPage() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vehicles</h1>
        <p className="text-slate-600 dark:text-slate-300">Manage your vehicles.</p>
      </div>
      <PremiumGuard feature="Multi-Vehicle Management">
        <VehicleManager />
      </PremiumGuard>
    </div>
  )
}


