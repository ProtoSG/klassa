'use server'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { LoginRequest, ChangePasswordRequest, LoginResponse } from './types'
import type { SessionUser } from '@/shared/store/session'

type LoginResult =
  | { ok: true; user: LoginResponse }
  | { ok: false; mustChangePassword: true; email: string }

export async function login(subdomain: string, data: LoginRequest): Promise<LoginResult> {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Subdomain': subdomain,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    if (err?.code === 'PASSWORD_CHANGE_REQUIRED') {
      return { ok: false, mustChangePassword: true, email: data.email }
    }
    throw new Error(err?.message ?? 'Credenciales inválidas')
  }

  await setAuthCookie(res)
  const jar = await cookies()
  jar.set(COOKIE_SUBDOMAIN, subdomain, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  const body = await res.json()
  return { ok: true, user: body.data as LoginResponse }
}

export async function platformLogin(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${BACKEND_URL}/api/platform/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? 'Credenciales inválidas')
  }

  await setAuthCookie(res)
  const body = await res.json()
  return body.data as LoginResponse
}

export async function changePassword(
  subdomain: string,
  data: ChangePasswordRequest
): Promise<LoginResponse> {
  const res = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Subdomain': subdomain,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? 'Error al cambiar contraseña')
  }

  // Backend returns a fresh JWT cookie on success → persist it for auto-login.
  await setAuthCookie(res)
  const jar = await cookies()
  jar.set(COOKIE_SUBDOMAIN, subdomain, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  const body = await res.json()
  return body.data as LoginResponse
}

export async function logout(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value

  if (token) {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
    }).catch(() => null)
  }

  jar.delete(COOKIE_NAME)
  jar.delete(COOKIE_SUBDOMAIN)
}

type SessionResult =
  | { ok: true; user: SessionUser; subdomain: string }
  | { ok: false; blocked: true; message: string }
  | { ok: false; blocked: false }

type MeFetchResult =
  | { ok: true; data: LoginResponse }
  | { ok: false; status: number; error: { message?: string } | null }

/**
 * `GET /api/auth/me`, deduped per request/render pass via React's `cache()`.
 * `getSessionOrBlockReason` (called once in the tenant layout) and `getMe`
 * (called again by most pages under it) both need this same response — without
 * memoization that's two backend round trips per page load. `cache()` keys by
 * argument, so both call sites share one in-flight/resolved call as long as
 * `token` matches (it always does — same cookie jar, same request).
 *
 * Not exported: this file has `'use server'` at the top, which turns every
 * exported async function into a Server Action reference. Wrapping an
 * *exported* function in `cache()` risks breaking that transform, so the
 * memoized work stays private and `getSessionOrBlockReason`/`getMe` keep
 * their original exported shape.
 */
const fetchAuthMe = cache(async (token: string): Promise<MeFetchResult> => {
  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: { Cookie: `${COOKIE_NAME}=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return { ok: false, status: res.status, error: err }
  }
  const data = await res.json()
  return { ok: true, data: data.data as LoginResponse }
})

/**
 * Like `getMe`, but distinguishes a tenant blocked (SUSPENDED/CANCELLED, rejected by
 * TenantInterceptor with 403) from a plain missing/expired session, so callers can show
 * the specific reason instead of a silent redirect to login.
 */
export async function getSessionOrBlockReason(): Promise<SessionResult> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE_NAME)?.value
    const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value
    if (!token) return { ok: false, blocked: false }
    const result = await fetchAuthMe(token)
    if (!result.ok) {
      if (result.status === 403 && result.error?.message) {
        return { ok: false, blocked: true, message: result.error.message }
      }
      return { ok: false, blocked: false }
    }
    const login = result.data
    return {
      ok: true,
      user: { email: login.email, fullName: login.fullName, role: login.role, tenantId: login.tenantId },
      subdomain: subdomain ?? login.tenantId,
    }
  } catch {
    return { ok: false, blocked: false }
  }
}

export async function getMe(): Promise<{ user: SessionUser; subdomain: string } | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE_NAME)?.value
    const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value
    if (!token) return null
    const result = await fetchAuthMe(token)
    if (!result.ok) return null
    const login = result.data
    return {
      user: { email: login.email, fullName: login.fullName, role: login.role, tenantId: login.tenantId },
      subdomain: subdomain ?? login.tenantId,
    }
  } catch {
    return null
  }
}

export async function getPlatformMe(): Promise<{ user: SessionUser; subdomain: string } | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE_NAME)?.value
    if (!token) return null
    const res = await fetch(`${BACKEND_URL}/api/platform/auth/me`, {
      headers: { Cookie: `${COOKIE_NAME}=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const login = data.data as LoginResponse
    return {
      user: { email: login.email, fullName: login.fullName, role: login.role, tenantId: login.tenantId },
      subdomain: 'platform',
    }
  } catch {
    return null
  }
}

async function setAuthCookie(res: Response) {
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) return
  const match = setCookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  if (!match) return
  const jar = await cookies()
  jar.set(COOKIE_NAME, match[1], {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}
