import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/shared/lib/constants'

const PUBLIC_PATHS = ['/auth/login', '/auth/change-password', '/platform/login', '/']

const ROLE_ALLOWED: Record<string, string[]> = {
  ADMIN:     ['/dashboard', '/students', '/academic-years', '/attendance', '/calendar', '/billing', '/users'],
  TEACHER:   ['/dashboard', '/students', '/academic-years', '/attendance', '/calendar'],
  TREASURER: ['/dashboard', '/calendar', '/billing'],
  PARENT:    ['/portal'],
}

// Where a denied navigation bounces back to, per role — must be a path each
// role's ROLE_ALLOWED entry actually grants, or the redirect below loops.
// A role with no entry here (PLATFORM_ADMIN/SUPPORT — they live under
// /platform, which skips this check entirely — or a malformed/unrecognized
// token) falls through to login instead of guessing a route, on purpose:
// bouncing to a hardcoded page that isn't actually in that role's allow-list
// reproduces the exact same infinite-redirect loop this map exists to avoid.
const DEFAULT_ROUTE: Record<string, string> = {
  ADMIN: '/dashboard',
  TEACHER: '/dashboard',
  TREASURER: '/dashboard',
  PARENT: '/portal',
}

function getRoleFromToken(token: string): string | null {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64)) as Record<string, unknown>
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  if (!token) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = pathname.startsWith('/platform') ? '/platform/login' : '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

  // Platform routes have their own auth — skip role check
  if (pathname.startsWith('/platform')) {
    return NextResponse.next()
  }

  const role = getRoleFromToken(token)
  const allowed = role ? (ROLE_ALLOWED[role] ?? []) : []
  const isAllowed = allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))

  if (!isAllowed) {
    const fallback = role ? DEFAULT_ROUTE[role] : undefined
    if (!fallback) {
      // No known-safe route for this role (unmapped role, or a token that
      // failed to parse) — send back to login rather than guessing, so an
      // unrecognized role can't end up looping between two disallowed pages.
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      return NextResponse.redirect(loginUrl)
    }
    // Without this flag the user gets silently bounced with zero explanation —
    // easy to hit right after a role change, since the client session store only re-syncs on
    // the next full navigation (see SessionInitializer).
    const dashboardUrl = req.nextUrl.clone()
    dashboardUrl.pathname = fallback
    dashboardUrl.searchParams.set('denied', '1')
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
