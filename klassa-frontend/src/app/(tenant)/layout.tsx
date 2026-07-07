import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import BottomNav from '@/shared/components/BottomNav'
import TenantHeader from '@/features/tenant/components/TenantHeader'
import SessionInitializer from '@/shared/components/SessionInitializer'
import { Toaster } from '@/components/ui/sonner'
import { getMe } from '@/features/auth/actions'

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const session = await getMe()
  if (!session) redirect('/auth/login')

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SessionInitializer user={session.user} subdomain={session.subdomain} />
      <TenantHeader />
      <main className="flex-1 pt-4 pb-24 md:pt-24 md:pb-8">{children}</main>
      <BottomNav />
      <Toaster richColors position="bottom-center" />
    </div>
  )
}
