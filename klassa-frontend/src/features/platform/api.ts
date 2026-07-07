import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME } from '@/shared/lib/constants'
import type { TenantResponse, Plan } from './types'

async function platformFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value

  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
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

export async function getTenants(): Promise<TenantResponse[]> {
  return platformFetch<TenantResponse[]>('/tenants')
}

export async function getTenantBySubdomain(subdomain: string): Promise<TenantResponse> {
  return platformFetch<TenantResponse>(`/tenants/${subdomain}`)
}

export async function getPlans(): Promise<Plan[]> {
  return platformFetch<Plan[]>('/plans')
}
