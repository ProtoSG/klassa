import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { Subject } from './types'

export async function getSubjects(gradeLevelId?: number): Promise<Subject[]> {
  const q = gradeLevelId ? `?gradeLevelId=${gradeLevelId}` : ''
  return tenantFetch<Subject[]>(`/subjects${q}`)
}
