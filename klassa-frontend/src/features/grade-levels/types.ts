export type GradeLevelType = 'INITIAL' | 'PRIMARY' | 'SECONDARY'

export interface GradeLevel {
  id: number
  name: string
  level: GradeLevelType
  sortOrder: number
}

export interface CreateGradeLevelInput {
  name: string
  level: GradeLevelType
  sortOrder?: number
}
