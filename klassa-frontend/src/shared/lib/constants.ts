export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080'
export const COOKIE_NAME = 'klassa_token'
export const COOKIE_SUBDOMAIN = 'klassa_subdomain'

// CSRF names — kept for when the app is moved to same-origin (Next.js proxy)
// and the double-submit cookie protection is re-enabled. See SecurityConfig.java.
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN'
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN'
