'use client'

import { useEffect } from 'react'
import { useSession } from '@/shared/store/session'
import type { SessionUser } from '@/shared/store/session'

interface Props {
  user: SessionUser
  subdomain: string
}

export default function SessionInitializer({ user, subdomain }: Props) {
  const { setSession } = useSession()
  // Re-sync on every render, not just mount: this component stays mounted across client-side
  // navigations within the (tenant) layout, but the server re-fetches the session fresh on each
  // one — if a role or tenant-status change isn't re-synced here, the header keeps showing nav
  // options for a role the user no longer has (see TenantHeader).
  useEffect(() => { setSession(user, subdomain) }, [user, subdomain, setSession])
  return null
}
