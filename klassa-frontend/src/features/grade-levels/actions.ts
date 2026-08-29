'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { CreateGradeLevelInput } from './schemas'
import type { GradeLevel } from './types'

const tenantFetch = createTenantAction()

export async function createGradeLevel(input: CreateGradeLevelInput): Promise<GradeLevel> {
  const level = await tenantFetch<GradeLevel>('/grade-levels', 'POST', input)
  revalidatePath('/academic-years')
  return level
}

export async function updateGradeLevel(id: number, input: CreateGradeLevelInput): Promise<GradeLevel> {
  const level = await tenantFetch<GradeLevel>(`/grade-levels/${id}`, 'PUT', input)
  revalidatePath('/academic-years')
  return level
}
