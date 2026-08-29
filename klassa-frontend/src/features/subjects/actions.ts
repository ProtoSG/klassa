'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { CreateSubjectInput } from './schemas'
import type { Subject } from './types'

const tenantFetch = createTenantAction()

export async function createSubject(input: CreateSubjectInput): Promise<Subject> {
  const subject = await tenantFetch<Subject>('/subjects', 'POST', input)
  revalidatePath('/academic-years')
  return subject
}

export async function updateSubject(id: number, input: CreateSubjectInput): Promise<Subject> {
  const subject = await tenantFetch<Subject>(`/subjects/${id}`, 'PUT', input)
  revalidatePath('/academic-years')
  return subject
}

export async function deactivateSubject(id: number): Promise<void> {
  await tenantFetch<void>(`/subjects/${id}`, 'DELETE')
  revalidatePath('/academic-years')
}
