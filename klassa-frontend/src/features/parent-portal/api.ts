import { tenantFetch } from '@/shared/lib/tenant-fetch'
import { getStudentEnrollments } from '@/features/students/api'
import { logFetchError } from '@/shared/lib/log-error'
import type { StudentResponse, EnrollmentResponse } from '@/features/students/types'

/**
 * The logged-in parent's own children. Backend resolves the family from the
 * authenticated principal — throws `ApiError` with `code: 'FAMILY_NOT_LINKED'`
 * (422) if the account has no family linked yet. See `ApiError` in
 * `@/shared/lib/tenant-fetch` for how callers should branch on that.
 */
export async function getMyChildren(): Promise<StudentResponse[]> {
  return tenantFetch<StudentResponse[]>('/families/me/students')
}

/**
 * Prefers the active enrollment; falls back to the most recent one otherwise.
 * Picks by `enrolledAt` explicitly rather than array order — the backend
 * gives no ordering guarantee, and a student can (rare edge case: mid-year
 * section transfer) have more than one ACTIVE row at once.
 */
export function pickCurrentEnrollment(enrollments: EnrollmentResponse[]): EnrollmentResponse | null {
  if (enrollments.length === 0) return null
  const active = enrollments.filter((e) => e.status === 'ACTIVE')
  const pool = active.length > 0 ? active : enrollments
  return pool.reduce((latest, e) => (e.enrolledAt > latest.enrolledAt ? e : latest))
}

export interface ChildWithEnrollment {
  student: StudentResponse
  enrollment: EnrollmentResponse | null
}

/**
 * Every child of the parent's family, each paired with their current
 * enrollment (or `null` if they have none). Grades/attendance are keyed by
 * enrollment id, not student id, so most parent-portal pages need this shape.
 */
export async function getMyChildrenWithEnrollment(): Promise<ChildWithEnrollment[]> {
  const children = await getMyChildren()
  return Promise.all(
    children.map(async (student) => {
      const enrollments = await getStudentEnrollments(student.id)
        .catch((err) => { logFetchError(`parent-portal-enrollments-${student.id}`, err); return [] })
      return { student, enrollment: pickCurrentEnrollment(enrollments) }
    }),
  )
}
