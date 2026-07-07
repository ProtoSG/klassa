import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import SessionInitializer from '@/shared/components/SessionInitializer'
import { getPlatformMe } from '@/features/auth/actions'

export default async function PlatformAdminLayout({ children }: { children: ReactNode }) {
  const session = await getPlatformMe()
  if (!session) redirect('/platform/login')
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SessionInitializer user={session.user} subdomain={session.subdomain} />
      <header className="border-b border-line bg-white px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
              <span className="text-accent font-semibold text-sm">K</span>
            </div>
            <span className="font-medium text-ink">Klassa Platform</span>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  )
}
