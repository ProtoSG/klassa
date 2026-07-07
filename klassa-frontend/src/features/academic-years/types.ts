export interface AcademicYearResponse {
  id: number
  name: string
  startDate: string
  endDate: string
  active: boolean
}

export interface CreateAcademicYearInput {
  name: string
  startDate: string
  endDate: string
}
