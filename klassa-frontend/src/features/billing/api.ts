import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { FeeScheduleResponse, InvoiceResponse, InvoiceStatus } from './types'
import type { PageResponse } from '@/shared/types/api'

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

export async function getFeeSchedules(academicYearId: number): Promise<FeeScheduleResponse[]> {
  return tenantFetch<FeeScheduleResponse[]>(`/billing/fee-schedules?academicYearId=${academicYearId}`)
}

export async function getInvoicesByStudent(
  studentId: number,
  page = 0,
  size = 12,
  status?: InvoiceStatus,
): Promise<PageResponse<InvoiceResponse>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set('status', status)
  return tenantFetch<PageResponse<InvoiceResponse>>(`/billing/invoices/student/${studentId}?${params}`)
}

export async function getStudentBalance(studentId: number): Promise<string> {
  return tenantFetch<string>(`/billing/invoices/student/${studentId}/balance`)
}
