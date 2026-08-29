import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { StudentResponse, FamilyResponse, EnrollmentResponse, PageResponse } from './types'

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
