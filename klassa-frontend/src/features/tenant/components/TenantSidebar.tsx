'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSession } from '@/shared/store/session'
import { useSidebar } from '@/shared/store/sidebar'
import { TENANT_NAV_ITEMS } from '@/shared/lib/nav-items'
import type { UserRole } from '@/shared/store/session'

export default function TenantSidebar() {
  const pathname = usePathname()
  const { user } = useSession()
  const collapsed = useSidebar((s) => s.collapsed)
  const toggle = useSidebar((s) => s.toggle)

  const visibleItems = TENANT_NAV_ITEMS.filter((item) =>
    item.roles.includes((user?.role ?? '') as UserRole),
  )

  return (
    <aside
      className={`hidden md:block fixed left-5 top-5 bottom-5 z-40 transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-44'
      }`}
    >
      <nav className="bg-ink rounded-xl p-2 h-full flex flex-col gap-0.5">
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="flex items-center justify-center py-2.5 mb-1 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {visibleItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center px-0' : 'px-3'
              } ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={16} />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
