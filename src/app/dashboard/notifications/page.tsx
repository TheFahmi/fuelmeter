'use client'

import { Notifications } from '@/components/notifications'

export default function NotificationsPage() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
        <p className="text-slate-600 dark:text-slate-300">Your latest app alerts and messages.</p>
      </div>
      <Notifications />
    </div>
  )
}


