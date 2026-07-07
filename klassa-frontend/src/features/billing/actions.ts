'use server'

import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { FeeScheduleResponse, InvoiceResponse, InvoiceStatus, PaymentMethod, PaymentResponse } from './types'
import type { PageResponse } from '@/shared/types/api'

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

export async function createFeeSchedule(input: {
  concept: string
  amount: number
  dueDay: number
  academicYearId: number
}): Promise<FeeScheduleResponse> {
  return tenantFetch<FeeScheduleResponse>('/billing/fee-schedules', 'POST', input)
}

export async function deleteFeeSchedule(id: number): Promise<void> {
  await tenantFetch<FeeScheduleResponse>(`/billing/fee-schedules/${id}`, 'DELETE')
}

export async function generateMonthlyInvoices(input: {
  academicYearId: number
  feeScheduleId: number
  dueDate: string
}): Promise<void> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value
  const res = await fetch(`${BACKEND_URL}/api/billing/invoices/generate-monthly`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      ...(subdomain ? { 'X-Tenant-Subdomain': subdomain } : {}),
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? `Error ${res.status}`)
  }
}

export async function fetchInvoicesByStudent(
  studentId: number,
  page = 0,
  size = 12,
  status?: InvoiceStatus,
): Promise<PageResponse<InvoiceResponse>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set('status', status)
  return tenantFetch<PageResponse<InvoiceResponse>>(`/billing/invoices/student/${studentId}?${params}`)
}

export async function fetchStudentBalance(studentId: number): Promise<string> {
  return tenantFetch<string>(`/billing/invoices/student/${studentId}/balance`)
}

export async function registerPayment(input: {
  invoiceId: number
  amount: number
  paymentDate: string
  method: PaymentMethod
  receiptNumber: string
  notes: string
}): Promise<InvoiceResponse> {
  const result = await tenantFetch<{ payment: unknown; updatedInvoice: InvoiceResponse }>(
    '/billing/payments',
    'POST',
    input,
  )
  return result.updatedInvoice
}

export async function cancelInvoice(id: number): Promise<InvoiceResponse> {
  return tenantFetch<InvoiceResponse>(`/billing/invoices/${id}/cancel`, 'POST')
}

export async function fetchPaymentsByInvoice(invoiceId: number): Promise<PaymentResponse[]> {
  return tenantFetch<PaymentResponse[]>(`/billing/payments/invoice/${invoiceId}`)
}
