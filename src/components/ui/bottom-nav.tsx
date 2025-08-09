'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, List, BarChart3, Crown } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/add-record', label: 'Add', icon: PlusCircle },
    { href: '/dashboard/records', label: 'Records', icon: List },
    { href: '/dashboard/statistics', label: 'Stats', icon: BarChart3 },
    { href: '/dashboard/premium', label: 'Premium', icon: Crown },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="mx-auto max-w-2xl rounded-2xl backdrop-blur-xl bg-slate-100/80 dark:bg-white/10 border border-slate-300/60 dark:border-white/10 shadow-2xl">
        <ul className="grid grid-cols-5">
          {items.map(({ href, label, icon: Icon }) => {
            const isRoot = href === '/dashboard'
            const active = isRoot ? (pathname === href) : (pathname === href || pathname.startsWith(href + '/'))
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs transition-colors rounded-xl ${
                    active
                      ? 'text-white bg-slate-900 dark:bg-white/15 dark:text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}


