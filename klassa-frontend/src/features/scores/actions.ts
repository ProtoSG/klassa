'use server'

import { createTenantAction } from '@/shared/lib/tenant-fetch'
import type { CreateScoreInput } from './schemas'
import type { ScoreResponse } from './types'

const tenantFetch = createTenantAction()

export async function saveScore(input: CreateScoreInput): Promise<ScoreResponse> {
  return tenantFetch<ScoreResponse>('/scores', 'POST', {
    enrollmentId: input.enrollmentId,
    subjectId: input.subjectId,
    period: input.period,
    score: parseFloat(input.score),
  })
}

export async function fetchScoresByEnrollment(enrollmentId: number): Promise<ScoreResponse[]> {
  return tenantFetch<ScoreResponse[]>(`/scores/enrollment/${enrollmentId}`, 'GET')
}
