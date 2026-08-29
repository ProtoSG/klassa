import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { UserResponse, UserRole, PageResponse } from './types'

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
