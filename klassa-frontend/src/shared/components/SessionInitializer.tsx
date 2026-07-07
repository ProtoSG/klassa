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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSession(user, subdomain) }, [])
  return null
}
