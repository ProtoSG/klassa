import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { StudentResponse, FamilyResponse, EnrollmentResponse, PageResponse } from './types'

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

export async function getStudentPage(params: {
  page?: number
  size?: number
  status?: string
  search?: string
}): Promise<PageResponse<StudentResponse>> {
  const q = new URLSearchParams()
  if (params.page !== undefined) q.set('page', String(params.page))
  if (params.size !== undefined) q.set('size', String(params.size))
  if (params.status) q.set('status', params.status)
  if (params.search) q.set('search', params.search)
  return tenantFetch<PageResponse<StudentResponse>>(`/students?${q}`)
}

export async function getStudentById(id: number): Promise<StudentResponse> {
  return tenantFetch<StudentResponse>(`/students/${id}`)
}

export async function getFamilyById(id: number): Promise<FamilyResponse> {
  return tenantFetch<FamilyResponse>(`/families/${id}`)
}

export async function getStudentEnrollments(studentId: number): Promise<EnrollmentResponse[]> {
  return tenantFetch<EnrollmentResponse[]>(`/enrollments/student/${studentId}`)
}
