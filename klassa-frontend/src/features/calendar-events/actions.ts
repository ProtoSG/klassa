'use server'

import { revalidatePath } from 'next/cache'
import { createTenantAction } from '@/shared/lib/tenant-fetch'
import { getStudentPage } from '@/features/students/api'
import type { CreateCalendarEventInput } from './schemas'
import type { CalendarEvent } from './types'

const tenantFetch = createTenantAction({ cache: 'no-store', on204: 'null' })

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

export interface FamilyAnnouncementTarget {
  familyId: number
  guardianName: string
  phone: string
}

/**
 * Fetch every active student's family, deduped by familyId (siblings share one
 * announcement), with a usable phone. Runs as a Server Action because it pulls
 * cookies via tenantFetch — a Client Component can't do that transitively in
 * Next 16 without hitting the "next/headers in Pages Router" guard.
 *
 * Cap at 10 pages (~1000 students) per the existing pagination contract. For
 * larger schools, a dedicated /api/families endpoint is the right fix — not
 * yet built.
 */
export async function fetchFamiliesForAnnouncement(): Promise<FamilyAnnouncementTarget[]> {
    const all: { familyId: number; phone: string | null; guardianName: string }[] = []
    let page = 0
    while (true) {
        const resp = await getStudentPage({ status: 'ACTIVE', page, size: 100 })
        for (const s of resp.content) {
            all.push({ familyId: s.familyId, phone: s.guardianPhone, guardianName: s.guardianName })
        }
        if (resp.content.length < resp.size || page >= resp.totalPages - 1) break
        page++
        if (page > 10) break
    }
    const byFamily = new Map<number, { phone: string | null; guardianName: string }>()
    for (const r of all) {
        if (!byFamily.has(r.familyId)) {
            byFamily.set(r.familyId, { phone: r.phone, guardianName: r.guardianName })
        }
    }
    return Array.from(byFamily.values())
        .filter((f): f is { phone: string; guardianName: string; familyId: number } => f.phone !== null)
        .map((f) => ({ familyId: f.familyId, phone: f.phone, guardianName: f.guardianName }))
}
