'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { CreateAcademicYearInput } from './schemas'
import type { AcademicYearResponse } from './types'

const tenantFetch = createTenantAction({ on204: 'undefined' })

export async function createAcademicYear(input: CreateAcademicYearInput): Promise<AcademicYearResponse> {
  const year = await tenantFetch<AcademicYearResponse>('/academic-years', 'POST', input)
  revalidatePath('/academic-years')
  return year
}

export async function activateAcademicYear(id: number): Promise<AcademicYearResponse> {
  const year = await tenantFetch<AcademicYearResponse>(`/academic-years/${id}/activate`, 'POST')
  revalidatePath('/academic-years')
  return year
}

export async function closeAcademicYear(id: number): Promise<void> {
  await tenantFetch<void>(`/academic-years/${id}/close`, 'POST')
  revalidatePath('/academic-years')
}
