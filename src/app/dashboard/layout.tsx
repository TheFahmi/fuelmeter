import { BottomNav } from '@/components/ui/bottom-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24">{/* bottom padding for nav */}
      {children}
      <BottomNav />
    </div>
  )
}


