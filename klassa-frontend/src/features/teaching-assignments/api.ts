import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { TeachingAssignmentResponse } from './types'

export async function getTeachingAssignmentsBySection(sectionId: number): Promise<TeachingAssignmentResponse[]> {
  return tenantFetch<TeachingAssignmentResponse[]>(`/teaching-assignments?sectionId=${sectionId}`)
}
