'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/shared/store/session'
import { TENANT_NAV_ITEMS } from '@/shared/lib/nav-items'
import type { UserRole } from '@/shared/store/session'

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useSession()

  const visibleItems = TENANT_NAV_ITEMS.filter((item) =>
    item.roles.includes((user?.role ?? '') as UserRole),
  )

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="bg-ink rounded-2xl px-1 py-1.5 shadow-hover">
        <ul className="flex">
          {visibleItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-1 py-2 px-0.5 text-xs rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-accent/20 text-accent'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={17} />
                  <span className="font-medium text-[10px]">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
