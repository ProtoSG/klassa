'use client'

import type { ReactNode } from 'react'
import { useSidebar } from '@/shared/store/sidebar'

export default function TenantMain({ children }: { children: ReactNode }) {
  const collapsed = useSidebar((s) => s.collapsed)

  return (
    <main
      className={`flex-1 pt-4 pb-24 md:pt-24 md:pb-8 transition-[padding] duration-200 ${
        collapsed ? 'md:pl-24' : 'md:pl-52'
      }`}
    >
      {children}
    </main>
  )
}
