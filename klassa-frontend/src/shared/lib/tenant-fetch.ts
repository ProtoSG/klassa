import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'

/**
 * Shared tenant-aware fetch helpers used across `src/features/*` `api.ts` and
 * `actions.ts` modules. Reads the tenant auth cookie + subdomain cookie,
 * attaches them as request headers, and unwraps the backend's
 * `{ data: T }` envelope.
 */

/**
 * Thrown by `tenantFetch`/`createTenantAction` on a non-OK response. Extends
 * `Error` (so existing `err instanceof Error` / `err.message` call sites keep
 * working unchanged) but also carries the backend's `ApiResponse.code` and
 * HTTP `status`, so callers that need to branch on a specific error code
 * (e.g. `FAMILY_NOT_LINKED`) don't have to resort to matching on message text.
 *
 * That `.code`/`.status` branching only works when `ApiError` is caught in
 * the same server render that threw it (e.g. a Server Component `api.ts`
 * call, as `parent-portal` does today). `createTenantAction` backs `actions.ts`
 * Server Functions (`'use server'`) — a thrown error crossing that RPC
 * boundary into a Client Component catch does NOT reliably preserve custom
 * fields (Next redacts to a generic message + digest in production). Model
 * expected errors from a Server Action as a return value instead if a client
 * needs to branch on `.code`.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function buildTenantHeaders(): Promise<Record<string, string>> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value

  return {
    ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
    ...(subdomain ? { 'X-Tenant-Subdomain': subdomain } : {}),
  }
}

// CSRF double-submit wiring (intentionally disabled — see SecurityConfig.java).
// Re-enable together with the backend `CookieCsrfTokenRepository` block once
// the frontend and backend share an origin (Next.js proxy).
/*
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './constants'
async function buildTenantHeadersWithCsrf(method: string = 'GET'): Promise<Record<string, string>> {
  const jar = await cookies()
  const headers = await buildTenantHeaders()
  const csrf = jar.get(CSRF_COOKIE_NAME)?.value
  if (csrf && method !== 'GET' && method !== 'HEAD') headers[CSRF_HEADER_NAME] = csrf
  return headers
}
*/

/**
 * GET-style tenant fetch used by `api.ts` modules. Always opts out of the
 * Next.js data cache (`cache: 'no-store'`), matching the previous per-file
 * implementations.
 */
export async function tenantFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(await buildTenantHeaders()),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new ApiError(err?.message ?? `Error ${res.status}`, res.status, err?.code ?? null)
  }

  const body = await res.json()
  return body.data as T
}

type TenantAction = <T>(path: string, method?: string, body?: unknown) => Promise<T>

interface TenantActionOptions {
  /** Set to `'no-store'` to match implementations that forced this explicitly. */
  cache?: RequestCache
  /** How to handle a `204 No Content` response. Defaults to `'none'` (calls `res.json()` regardless, matching the original behavior of most `actions.ts` files). */
  on204?: 'none' | 'undefined' | 'null'
  /** Default HTTP method when the caller omits it. */
  defaultMethod?: string
}

/**
 * Factory for the method/body-style tenant fetch used by `actions.ts`
 * modules. Each feature's local copy differed slightly (cache option, 204
 * handling, default method) — those variations are preserved per-caller via
 * `options` rather than unified, to keep behavior byte-for-byte identical.
 */
export function createTenantAction(options: TenantActionOptions = {}): TenantAction {
  const { cache, on204 = 'none', defaultMethod } = options

  return async function tenantFetch<T>(
    path: string,
    method: string = defaultMethod ?? 'GET',
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${BACKEND_URL}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(await buildTenantHeaders()),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(cache ? { cache } : {}),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new ApiError(err?.message ?? `Error ${res.status}`, res.status, err?.code ?? null)
    }

    if (res.status === 204) {
      if (on204 === 'null') return null as T
      if (on204 === 'undefined') return undefined as T
    }

    const data = await res.json()
    return data.data as T
  }
}
