export interface ScoreResponse {
  id: number
  enrollmentId: number | null
  subjectId: number
  subjectName: string
  period: number
  score: string
}

export interface CreateScoreInput {
  enrollmentId: number
  subjectId: number
  period: number
  score: string
}
