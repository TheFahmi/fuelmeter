import { BottomNav } from '@/components/ui/bottom-nav'
import { BurgerMenu } from '@/components/ui/menu'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24">{/* bottom padding for nav */}
      <BurgerMenu />
      {children}
      <BottomNav />
    </div>
  )
}


