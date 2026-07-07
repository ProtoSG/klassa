export interface Subject {
  id: number
  name: string
  gradeLevelId: number
  gradeLevelName: string
  hoursPerWeek: number
  active: boolean
}

export interface CreateSubjectInput {
  name: string
  gradeLevelId: number
  hoursPerWeek?: number
}
