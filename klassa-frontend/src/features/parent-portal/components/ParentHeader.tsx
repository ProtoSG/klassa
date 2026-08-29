'use client'

import { useSession } from '@/shared/store/session'
import { useSidebar } from '@/shared/store/sidebar'
import ParentUserMenu from './ParentUserMenu'
import NotificationBell from '@/features/notifications/components/NotificationBell'

/** Same floating-header pattern as `@/features/tenant/components/TenantHeader`, minus the assistant button (no assistant in the parent portal). Desktop-only — mobile keeps `ParentTopBar`. */
export default function ParentHeader() {
  const { subdomain } = useSession()
  const collapsed = useSidebar((s) => s.collapsed)

  return (
    <header
      className={`hidden md:block fixed top-5 right-5 z-50 transition-[left] duration-200 ${
        collapsed ? 'left-24' : 'left-52'
      }`}
    >
      <div className="bg-ink rounded-xl px-2 py-1.5 max-w-7xl mx-auto flex items-center justify-between gap-1">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-ink font-semibold text-sm">K</span>
          </div>
          <div className="leading-tight">
            <p className="text-white text-xs font-medium">Portal de familias</p>
            {subdomain && <span className="text-[10px] text-white/50 font-mono">{subdomain}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell />
          <ParentUserMenu />
        </div>
      </div>
    </header>
  )
}
