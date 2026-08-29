import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import BottomNav from '@/shared/components/BottomNav'
import TenantHeader from '@/features/tenant/components/TenantHeader'
import TenantSidebar from '@/features/tenant/components/TenantSidebar'
import TenantMain from '@/features/tenant/components/TenantMain'
import SessionInitializer from '@/shared/components/SessionInitializer'
import AssistantChat from '@/features/assistant/components/AssistantChat'
import { Toaster } from '@/components/ui/sonner'
import { getSessionOrBlockReason } from '@/features/auth/actions'

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const session = await getSessionOrBlockReason()
  if (!session.ok) {
    redirect(session.blocked ? `/auth/login?blocked=${encodeURIComponent(session.message)}` : '/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SessionInitializer user={session.user} subdomain={session.subdomain} />
      <TenantHeader />
      <TenantSidebar />
      <TenantMain>{children}</TenantMain>
      <BottomNav />
      <AssistantChat />
      <Toaster richColors position="bottom-center" />
    </div>
  )
}
