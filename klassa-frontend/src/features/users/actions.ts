'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { UserResponse, UserRole } from './types'

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
  if (res.status === 204) return undefined as T
  const data = await res.json()
  return data.data as T
}

export interface CreateUserInput {
  email: string
  password: string
  role: UserRole
  firstName: string
  lastName: string
}

export interface UpdateUserInput {
  email: string
  password: string | null
  role: UserRole
  firstName: string
  lastName: string
}

export async function createUser(input: CreateUserInput): Promise<UserResponse> {
  const user = await tenantFetch<UserResponse>('/users', 'POST', input)
  revalidatePath('/users')
  return user
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<UserResponse> {
  const user = await tenantFetch<UserResponse>(`/users/${id}`, 'PUT', input)
  revalidatePath('/users')
  return user
}

export async function deactivateUser(id: number): Promise<void> {
  await tenantFetch<void>(`/users/${id}`, 'DELETE')
  revalidatePath('/users')
}

export async function activateUser(id: number): Promise<UserResponse> {
  const user = await tenantFetch<UserResponse>(`/users/${id}/activate`, 'PATCH')
  revalidatePath('/users')
  return user
}
