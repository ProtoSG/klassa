import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/shared/lib/constants'

const PUBLIC_PATHS = ['/auth/login', '/auth/change-password', '/platform/login', '/']

const ROLE_ALLOWED: Record<string, string[]> = {
  ADMIN:     ['/dashboard', '/students', '/academic-years', '/attendance', '/billing', '/users'],
  TEACHER:   ['/dashboard', '/students', '/academic-years', '/attendance'],
  TREASURER: ['/dashboard', '/billing'],
  PARENT:    ['/dashboard'],
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
    const dashboardUrl = req.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
