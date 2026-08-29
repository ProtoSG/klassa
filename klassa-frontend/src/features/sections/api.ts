import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { SectionResponse } from './types'

export async function getSectionsByYear(
  academicYearId: number,
  options?: { mine?: boolean }
): Promise<SectionResponse[]> {
  const mineParam = options?.mine ? '&mine=true' : ''
  return tenantFetch<SectionResponse[]>(`/sections?academicYearId=${academicYearId}${mineParam}`)
}

export async function getSectionById(id: number): Promise<SectionResponse> {
  return tenantFetch<SectionResponse>(`/sections/${id}`)
}
