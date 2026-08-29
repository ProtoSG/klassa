import { unstable_rethrow } from 'next/navigation'

/**
 * Minimal server-side visibility for swallowed fetch failures.
 *
 * Tenant pages catch fetch errors and render an explicit error state instead
 * of silently treating a backend outage as "no data yet" — but without this,
 * the caught error itself vanished (no console output, no APM). This at
 * least lands the failure in server logs so an outage isn't invisible until
 * a user complains. Not a replacement for real APM/alerting.
 *
 * unstable_rethrow first: cookies()/no-store fetch during static generation
 * throw Next's internal DYNAMIC_SERVER_USAGE control-flow signal through
 * this same .catch — logging that as a "failure" is misleading build noise.
 */
export function logFetchError(context: string, err: unknown) {
  unstable_rethrow(err)
  console.error(`[fetch] ${context} failed:`, err)
}
