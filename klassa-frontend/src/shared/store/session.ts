import { create } from 'zustand'

export type UserRole =
  | 'ADMIN'
  | 'TEACHER'
  | 'TREASURER'
  | 'PARENT'
  | 'PLATFORM_ADMIN'
  | 'SUPPORT'

export interface SessionUser {
  email: string
  fullName: string
  role: UserRole
  tenantId: string
}

interface SessionState {
  user: SessionUser | null
  subdomain: string | null
  setSession: (user: SessionUser, subdomain: string) => void
  clearSession: () => void
}

export const useSession = create<SessionState>()((set) => ({
  user: null,
  subdomain: null,
  setSession: (user, subdomain) => set({ user, subdomain }),
  clearSession: () => set({ user: null, subdomain: null }),
}))
