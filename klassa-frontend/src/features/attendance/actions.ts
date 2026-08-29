'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { AttendanceResponse } from './types'
import type { EnrollmentResponse } from '@/features/enrollments/types'

const tenantFetch = createTenantAction({ cache: 'no-store', defaultMethod: 'GET' })

export async function fetchEnrollmentsBySection(
  sectionId: number,
): Promise<EnrollmentResponse[]> {
  return tenantFetch<EnrollmentResponse[]>(`/enrollments/section/${sectionId}`)
}

export async function fetchAttendanceBySectionDate(
  sectionId: number,
  date: string,
): Promise<AttendanceResponse[]> {
  return tenantFetch<AttendanceResponse[]>(`/attendance/section/${sectionId}/date/${date}`)
}

export async function registerAttendanceBatch(
  records: { enrollmentId: number; date: string; status: string; note: string }[],
): Promise<void> {
  await Promise.all(
    records.map((r) =>
      tenantFetch('/attendance', 'POST', {
        enrollmentId: r.enrollmentId,
        date: r.date,
        status: r.status,
        note: r.note,
      }),
    ),
  )
  revalidatePath('/attendance')
}
