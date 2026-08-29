import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { AcademicYearResponse } from './types'

export async function getAcademicYears(): Promise<AcademicYearResponse[]> {
  return tenantFetch<AcademicYearResponse[]>('/academic-years')
}

export async function getAcademicYearById(id: number): Promise<AcademicYearResponse> {
  return tenantFetch<AcademicYearResponse>(`/academic-years/${id}`)
}
