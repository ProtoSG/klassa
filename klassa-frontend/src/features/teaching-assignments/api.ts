import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { TeachingAssignmentResponse } from './types'

async function tenantFetch<T>(path: string): Promise<T> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value

  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      ...(subdomain ? { 'X-Tenant-Subdomain': subdomain } : {}),
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

export async function getTeachingAssignmentsBySection(sectionId: number): Promise<TeachingAssignmentResponse[]> {
  return tenantFetch<TeachingAssignmentResponse[]>(`/teaching-assignments?sectionId=${sectionId}`)
}
