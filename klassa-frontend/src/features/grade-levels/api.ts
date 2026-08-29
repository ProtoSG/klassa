import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { GradeLevel, GradeLevelType } from './types'

export async function getGradeLevels(level?: GradeLevelType): Promise<GradeLevel[]> {
  const q = level ? `?level=${level}` : ''
  return tenantFetch<GradeLevel[]>(`/grade-levels${q}`)
}

export async function getGradeLevelsGrouped(): Promise<Record<GradeLevelType, GradeLevel[]>> {
  return tenantFetch<Record<GradeLevelType, GradeLevel[]>>('/grade-levels/grouped')
}
