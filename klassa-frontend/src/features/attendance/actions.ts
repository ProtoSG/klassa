'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { AttendanceResponse } from './types'
import type { EnrollmentResponse } from '@/features/enrollments/types'

async function tenantFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      ...(subdomain ? { 'X-Tenant-Subdomain': subdomain } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? `Error ${res.status}`)
  }
  const data = await res.json()
  return data.data as T
}

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
