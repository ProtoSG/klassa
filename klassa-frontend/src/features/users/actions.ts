'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { UserResponse, UserRole } from './types'

const tenantFetch = createTenantAction({ on204: 'undefined' })

export interface CreateUserInput {
  email: string
  password: string
  role: UserRole
  firstName: string
  lastName: string
  /**
   * Links the new login as that family's guardian user when role is PARENT.
   * The backend does NOT enforce this being set — omitting it silently
   * creates an unlinked PARENT account with no error, so always pass it
   * when creating a PARENT user through this flow.
   */
  familyId?: number
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
