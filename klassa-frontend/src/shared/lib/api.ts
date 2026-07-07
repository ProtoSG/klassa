import { BACKEND_URL, COOKIE_NAME } from './constants'
import type { ApiResponse } from '../types/api'

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { subdomain?: string; token?: string } = {}
): Promise<ApiResponse<T>> {
  const { subdomain, token, ...init } = options

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (subdomain) headers.set('X-Tenant-Subdomain', subdomain)
  if (token) headers.set('Cookie', `${COOKIE_NAME}=${token}`)

  const res = await fetch(`${BACKEND_URL}/api${path}`, { ...init, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? 'Request failed')
  }

  return res.json()
}
