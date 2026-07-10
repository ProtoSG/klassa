'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND_URL, COOKIE_NAME, COOKIE_SUBDOMAIN } from '@/shared/lib/constants'
import type { CreateCalendarEventInput } from './schemas'
import type { CalendarEvent } from './types'

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

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
  const event = await tenantFetch<CalendarEvent>('/calendar-events', 'POST', input)
  revalidatePath('/calendar')
  return event as CalendarEvent
}

export async function updateCalendarEvent(
  id: number,
  input: CreateCalendarEventInput
): Promise<CalendarEvent> {
  const event = await tenantFetch<CalendarEvent>(`/calendar-events/${id}`, 'PUT', input)
  revalidatePath('/calendar')
  return event as CalendarEvent
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await tenantFetch<void>(`/calendar-events/${id}`, 'DELETE')
  revalidatePath('/calendar')
}
