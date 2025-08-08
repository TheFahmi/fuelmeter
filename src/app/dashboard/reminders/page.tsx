'use client'

import { SmartReminders } from '@/components/smart-reminders'

export default function RemindersPage() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Service Reminders</h1>
        <p className="text-slate-600 dark:text-slate-300">Never miss your maintenance schedule.</p>
      </div>
      <SmartReminders />
    </div>
  )
}


