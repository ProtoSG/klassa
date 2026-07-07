'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { CreateSubjectInput } from './schemas'
import type { Subject } from './types'

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
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? `Error ${res.status}`)
  }

  const data = await res.json()
  return data.data as T
}

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
