import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { AttendanceResponse, AttendancePercentageResponse } from './types'

async function tenantFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      ...(subdomain ? { 'X-Tenant-Subdomain': subdomain } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? `Error ${res.status}`)
  }
  const body = await res.json()
  return body.data as T
}

export async function getAttendanceBySectionAndDate(
  sectionId: number,
  date: string,
): Promise<AttendanceResponse[]> {
  return tenantFetch<AttendanceResponse[]>(`/attendance/section/${sectionId}/date/${date}`)
}

export async function getAttendanceByEnrollment(
  enrollmentId: number,
  start?: string,
  end?: string,
): Promise<AttendanceResponse[]> {
  const params = start && end ? `?start=${start}&end=${end}` : ''
  return tenantFetch<AttendanceResponse[]>(`/attendance/enrollment/${enrollmentId}${params}`)
}

export async function getAttendancePercentage(
  enrollmentId: number,
  start: string,
  end: string,
): Promise<AttendancePercentageResponse> {
  return tenantFetch<AttendancePercentageResponse>(
    `/attendance/enrollment/${enrollmentId}/percentage?start=${start}&end=${end}`,
  )
}

export async function getRecentAttendance(
  enrollmentId: number,
  start: string,
  end: string,
): Promise<AttendanceResponse[]> {
  return tenantFetch<AttendanceResponse[]>(
    `/attendance/enrollment/${enrollmentId}?start=${start}&end=${end}`,
  )
}
