import { tenantFetch } from '@/shared/lib/tenant-fetch'
import type { ScoreResponse } from './types'

export async function getScoresByEnrollment(enrollmentId: number, period?: number): Promise<ScoreResponse[]> {
  const q = period !== undefined ? `?period=${period}` : ''
  return tenantFetch<ScoreResponse[]>(`/scores/enrollment/${enrollmentId}${q}`)
}

export async function getAverage(enrollmentId: number): Promise<string> {
  return tenantFetch<string>(`/scores/enrollment/${enrollmentId}/average`)
}
