'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { EnrollStudentInput } from './schemas'
import type { EnrollmentResponse } from './types'
import type { SectionResponse } from '@/features/sections/types'

const tenantFetch = createTenantAction({ cache: 'no-store' })

export async function enrollStudent(input: EnrollStudentInput): Promise<EnrollmentResponse> {
  const enrollment = await tenantFetch<EnrollmentResponse>('/enrollments', 'POST', input)
  revalidatePath('/academic-years')
  return enrollment
}

export async function withdrawEnrollment(id: number): Promise<EnrollmentResponse> {
  const enrollment = await tenantFetch<EnrollmentResponse>(`/enrollments/${id}/withdraw`, 'POST')
  revalidatePath('/academic-years')
  return enrollment
}

export async function transferEnrollment(
  enrollmentId: number,
  newSectionId: number,
): Promise<EnrollmentResponse> {
  const enrollment = await tenantFetch<EnrollmentResponse>(
    `/enrollments/${enrollmentId}/transfer?newSectionId=${newSectionId}`,
    'POST',
  )
  revalidatePath('/academic-years')
  return enrollment
}

export async function fetchSectionsForTransfer(currentSectionId: number): Promise<SectionResponse[]> {
  const section = await tenantFetch<SectionResponse>(`/sections/${currentSectionId}`, 'GET')
  const all = await tenantFetch<SectionResponse[]>(
    `/sections?academicYearId=${section.academicYearId}`,
    'GET',
  )
  return all.filter((s) => s.id !== currentSectionId)
}
