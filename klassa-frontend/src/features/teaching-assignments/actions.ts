'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { AssignTeacherInput } from './schemas'
import type { TeachingAssignmentResponse } from './types'

const tenantFetch = createTenantAction({ cache: 'no-store', on204: 'null' })

export async function assignTeacher(
  sectionId: number,
  input: AssignTeacherInput
): Promise<TeachingAssignmentResponse> {
  const assignment = await tenantFetch<TeachingAssignmentResponse>('/teaching-assignments', 'POST', {
    sectionId,
    ...input,
  })
  revalidatePath(`/academic-years/sections/${sectionId}`)
  return assignment as TeachingAssignmentResponse
}

export async function removeTeachingAssignment(id: number, sectionId: number): Promise<void> {
  await tenantFetch<void>(`/teaching-assignments/${id}`, 'DELETE')
  revalidatePath(`/academic-years/sections/${sectionId}`)
}
