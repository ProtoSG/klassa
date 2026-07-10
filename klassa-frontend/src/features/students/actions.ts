'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { NewStudentInput, UpdateStudentInput as UpdateStudentSchemaInput, UpdateFamilyInput as UpdateFamilySchemaInput } from './schemas'
import type { StudentResponse, FamilyResponse, StudentStatus } from './types'

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

export async function createStudent(input: NewStudentInput): Promise<StudentResponse> {
  const family = await tenantFetch<{ id: number }>('/families', 'POST', {
    guardianName: input.guardianName,
    guardianEmail: input.guardianEmail,
    guardianPhone: input.guardianPhone,
    address: input.address ?? '',
    emergencyContact: input.emergencyContact ?? '',
    emergencyPhone: input.emergencyPhone ?? '',
  })

  const student = await tenantFetch<StudentResponse>('/students', 'POST', {
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    gender: input.gender,
    familyId: family.id,
    photoUrl: null,
  })

  revalidatePath('/students')
  return student
}

export async function updateStudent(id: number, input: UpdateStudentSchemaInput, familyId: number | null): Promise<StudentResponse> {
  const student = await tenantFetch<StudentResponse>(`/students/${id}`, 'PUT', {
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    gender: input.gender,
    familyId,
    photoUrl: input.photoUrl ?? null,
  })

  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
  return student
}

export async function updateFamily(id: number, input: UpdateFamilySchemaInput): Promise<FamilyResponse> {
  const family = await tenantFetch<FamilyResponse>(`/families/${id}`, 'PUT', {
    guardianName: input.guardianName,
    guardianEmail: input.guardianEmail ?? '',
    guardianPhone: input.guardianPhone ?? '',
    address: input.address ?? '',
    emergencyContact: input.emergencyContact ?? '',
    emergencyPhone: input.emergencyPhone ?? '',
  })

  revalidatePath('/students')
  return family
}

export async function changeStudentStatus(id: number, status: StudentStatus): Promise<StudentResponse> {
  const student = await tenantFetch<StudentResponse>(`/students/${id}/status?status=${status}`, 'PATCH')

  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
  return student
}

export async function uploadStudentPhoto(id: number, formData: FormData): Promise<void> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const subdomain = jar.get(COOKIE_SUBDOMAIN)?.value

  const res = await fetch(`${BACKEND_URL}/api/students/${id}/photo`, {
    method: 'PATCH',
    headers: {
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      ...(subdomain ? { 'X-Tenant-Subdomain': subdomain } : {}),
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? `Error ${res.status}`)
  }

  revalidatePath('/students')
  revalidatePath(`/students/${id}`)
}
