import { cookies } from 'next/headers'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './constants'

/**
 * CSRF double-submit helper — INTENTIONALLY DISABLED.
 *
 * Disabled together with the matching block in `SecurityConfig.java` because
 * the frontend cross-origin (`localhost:3000`) cannot read the CSRF cookie
 * that Spring sets on the backend domain (`localhost:8080`). See the
 * SecurityConfig comment for the two viable paths to re-enable.
 *
 * The function below works; do not delete it — re-enable by:
 *   1. Uncomment the `csrf` block in SecurityConfig.java
 *   2. Wire this helper into `tenantFetch`/`platformFetch` and the raw
 *      `fetch` calls in `actions.ts` (see the commented helpers in
 *      `tenant-fetch.ts`).
 *   3. Add `X-XSRF-TOKEN` to the CORS allowed-headers list.
 *
 * Kept exported so the symbol is still resolvable if leftover imports slip in.
 */
export async function getCsrfHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get(CSRF_COOKIE_NAME)?.value
  return token ? { [CSRF_HEADER_NAME]: token } : {}
}
