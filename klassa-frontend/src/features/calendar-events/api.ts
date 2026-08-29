import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { CalendarEvent } from './types'

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  return tenantFetch<CalendarEvent[]>('/calendar-events')
}
