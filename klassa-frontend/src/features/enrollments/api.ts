import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { EnrollmentResponse } from './types'

export async function getEnrollmentsBySection(sectionId: number): Promise<EnrollmentResponse[]> {
  return tenantFetch<EnrollmentResponse[]>(`/enrollments/section/${sectionId}`)
}
