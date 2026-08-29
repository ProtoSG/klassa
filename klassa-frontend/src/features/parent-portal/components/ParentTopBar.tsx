'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { logout } from '@/features/auth/actions'
import { useSession } from '@/shared/store/session'
import NotificationBell from '@/features/notifications/components/NotificationBell'

/** Mobile-only sticky bar — desktop uses `ParentHeader` (floating) + `ParentSidebar`, same split as the tenant admin shell. */
export default function ParentTopBar() {
  const { subdomain, clearSession } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
      clearSession()
      router.push('/auth/login')
    })
  }

  return (
    <header className="sticky top-0 z-40 bg-ink md:hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
            <span className="text-ink font-semibold text-sm">K</span>
          </div>
          <div className="leading-tight">
            <p className="text-white text-sm font-medium">Portal de familias</p>
            {subdomain && <p className="text-white/50 text-[10px] font-mono">{subdomain}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={handleLogout}
            disabled={isPending}
            aria-label="Cerrar sesión"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150 disabled:opacity-50"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
