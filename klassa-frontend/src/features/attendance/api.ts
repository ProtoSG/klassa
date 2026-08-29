import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { AttendanceResponse, AttendancePercentageResponse } from './types'

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
