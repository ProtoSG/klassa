'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { CreateSectionInput } from './schemas'
import type { SectionResponse } from './types'

const tenantFetch = createTenantAction()

export async function createSection(input: CreateSectionInput): Promise<SectionResponse> {
  const section = await tenantFetch<SectionResponse>('/sections', 'POST', input)
  revalidatePath('/academic-years')
  return section
}

export async function updateSection(id: number, input: CreateSectionInput): Promise<SectionResponse> {
  const section = await tenantFetch<SectionResponse>(`/sections/${id}`, 'PUT', input)
  revalidatePath('/academic-years')
  return section
}
