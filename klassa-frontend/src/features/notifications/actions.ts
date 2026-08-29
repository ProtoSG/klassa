'use server'

import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { PageResponse } from '@/shared/types/api'
import type { NotificationResponse } from './types'

const tenantFetch = createTenantAction({ cache: 'no-store' })

/**
 * Self-scoped server actions used by `NotificationBell` (a client component,
 * so `api.ts`-style direct `cookies()` reads aren't reachable from it). Every
 * authenticated role can read/manage its own notifications — backend has no
 * role check here, just `authentication.principal.userId`.
 */
export async function getMyNotifications(page = 0, size = 20): Promise<PageResponse<NotificationResponse>> {
  return tenantFetch<PageResponse<NotificationResponse>>(`/notifications/me?page=${page}&size=${size}`)
}

export async function getUnreadNotificationCount(): Promise<number> {
  return tenantFetch<number>('/notifications/me/unread-count')
}

export async function markNotificationRead(id: number): Promise<void> {
  await tenantFetch<void>(`/notifications/${id}/read`, 'POST')
}

export async function markAllNotificationsRead(): Promise<void> {
  await tenantFetch<void>('/notifications/me/read-all', 'POST')
}
