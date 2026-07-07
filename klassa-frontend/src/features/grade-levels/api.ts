import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { GradeLevel, GradeLevelType } from './types'

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

export async function getGradeLevels(level?: GradeLevelType): Promise<GradeLevel[]> {
  const q = level ? `?level=${level}` : ''
  return tenantFetch<GradeLevel[]>(`/grade-levels${q}`)
}

export async function getGradeLevelsGrouped(): Promise<Record<GradeLevelType, GradeLevel[]>> {
  return tenantFetch<Record<GradeLevelType, GradeLevel[]>>('/grade-levels/grouped')
}
