export interface SectionResponse {
  id: number
  name: string
  gradeLevelId: number
  gradeLevelName: string
  academicYearId: number
  academicYearName: string
  homeroomTeacherId: number | null
  homeroomTeacherName: string | null
  maxCapacity: number
  activeEnrollments: number
}

export interface CreateSectionInput {
  name: string
  gradeLevelId: number
  academicYearId: number
  homeroomTeacherId?: number | null
  maxCapacity?: number
}
