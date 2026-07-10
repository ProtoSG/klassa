'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { AssignTeacherInput } from './schemas'
import type { TeachingAssignmentResponse } from './types'

async function tenantFetch<T>(path: string, method: string, body?: unknown): Promise<T | null> {
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

  if (res.status === 204) return null

  const data = await res.json()
  return data.data as T
}

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
