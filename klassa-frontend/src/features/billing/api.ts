import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { FeeScheduleResponse, InvoiceResponse, InvoiceStatus } from './types'
import type { PageResponse } from '@/shared/types/api'

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
