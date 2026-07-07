import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { UserResponse, UserRole, PageResponse } from './types'

async function tenantFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      ...(subdomain ? { 'X-Tenant-Subdomain': subdomain } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? `Error ${res.status}`)
  }
  const body = await res.json()
  return body.data as T
}

// Staff lists are small; the UI filters client-side, so fetch a single large page
// and return its content. The backend now returns a PageResponse, not a bare array.
const PAGE_SIZE = 200

export async function getUsers(role?: UserRole): Promise<UserResponse[]> {
  const params = new URLSearchParams({ size: String(PAGE_SIZE) })
  if (role) params.set('role', role)
  const page = await tenantFetch<PageResponse<UserResponse>>(`/users?${params}`)
  return page.content
}

export async function getInactiveUsers(): Promise<UserResponse[]> {
  const params = new URLSearchParams({ active: 'false', size: String(PAGE_SIZE) })
  const page = await tenantFetch<PageResponse<UserResponse>>(`/users?${params}`)
  return page.content
}
