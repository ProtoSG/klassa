'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logout } from '@/features/auth/actions'
import { useSession } from '@/shared/store/session'
import { TENANT_NAV_ITEMS } from '@/shared/lib/nav-items'
import type { UserRole } from '@/shared/store/session'

export default function TenantHeader() {
  const { user, subdomain, clearSession } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
      clearSession()
      router.push('/auth/login')
    })
  }

  return (
    <header className="hidden md:block fixed top-5 left-5 right-5 z-50">
      <div className="bg-ink rounded-xl px-2 py-1.5 max-w-7xl mx-auto flex items-center gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mr-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-ink font-semibold text-sm">K</span>
          </div>
          {subdomain && (
            <span className="text-xs text-white/50 font-mono">{subdomain}</span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 flex-1">
          {TENANT_NAV_ITEMS.filter((item) => item.roles.includes((user?.role ?? '') as UserRole)).map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: user + logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
          {user && (
            <div className="text-right hidden lg:block">
              <p className="text-xs font-medium text-white leading-none">{user.fullName}</p>
              <p className="text-xs text-white/40 mt-0.5">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
          >
            <LogOut size={15} />
            <span className="hidden lg:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
