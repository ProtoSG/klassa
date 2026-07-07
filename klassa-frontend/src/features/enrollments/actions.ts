'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { EnrollStudentInput } from './schemas'
import type { EnrollmentResponse } from './types'
import type { SectionResponse } from '@/features/sections/types'

async function tenantFetch<T>(path: string, method: string, body?: unknown): Promise<T> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      ...(subdomain ? { 'X-Tenant-Subdomain': subdomain } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? `Error ${res.status}`)
  }
  const data = await res.json()
  return data.data as T
}

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
