import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import ParentHeader from '@/features/parent-portal/components/ParentHeader'
import ParentSidebar from '@/features/parent-portal/components/ParentSidebar'
import ParentTopBar from '@/features/parent-portal/components/ParentTopBar'
import ParentMain from '@/features/parent-portal/components/ParentMain'
import ParentBottomNav from '@/features/parent-portal/components/ParentBottomNav'
import SessionInitializer from '@/shared/components/SessionInitializer'
import { Toaster } from '@/components/ui/sonner'
import { getSessionOrBlockReason } from '@/features/auth/actions'

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await getSessionOrBlockReason()
  if (!session.ok) {
    redirect(session.blocked ? `/auth/login?blocked=${encodeURIComponent(session.message)}` : '/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SessionInitializer user={session.user} subdomain={session.subdomain} />
      {/* Desktop: floating header (top-right) + floating sidebar (left) — same shell as the tenant admin view. */}
      <ParentHeader />
      <ParentSidebar />
      {/* Mobile: sticky top bar + floating bottom nav — both md:hidden. */}
      <ParentTopBar />
      <ParentMain>{children}</ParentMain>
      <ParentBottomNav />
      <Toaster richColors position="bottom-center" />
    </div>
  )
}
