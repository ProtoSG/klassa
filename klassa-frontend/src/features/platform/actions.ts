'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { BACKEND_URL, COOKIE_NAME } from '@/shared/lib/constants'
import type { TenantProvisionResponse, TenantResponse, TenantStatus, RegisterTenantRequest } from './types'

async function getToken() {
  const jar = await cookies()
  return jar.get(COOKIE_NAME)?.value
}

export async function createTenant(data: RegisterTenantRequest): Promise<TenantProvisionResponse> {
  const token = await getToken()
  const res = await fetch(`${BACKEND_URL}/api/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? 'Error al crear el colegio')
  }

  revalidatePath('/platform/dashboard')
  const body = await res.json()
  return body.data as TenantProvisionResponse
}

export async function updateTenantPlan(
  subdomain: string,
  planId: number
): Promise<TenantResponse> {
  const token = await getToken()
  const res = await fetch(
    `${BACKEND_URL}/api/tenants/${subdomain}/plan?planId=${planId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      },
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? 'Error al cambiar el plan')
  }

  revalidatePath('/platform/dashboard')
  revalidatePath(`/platform/tenants/${subdomain}`)
  const body = await res.json()
  return body.data as TenantResponse
}

export async function updateTenantStatus(
  subdomain: string,
  status: TenantStatus
): Promise<TenantResponse> {
  const token = await getToken()
  const res = await fetch(
    `${BACKEND_URL}/api/tenants/${subdomain}/status?status=${status}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Cookie: `${COOKIE_NAME}=${token}` } : {}),
      },
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? 'Error al actualizar estado')
  }

  revalidatePath('/platform/dashboard')
  revalidatePath(`/platform/tenants/${subdomain}`)
  const body = await res.json()
  return body.data as TenantResponse
}
