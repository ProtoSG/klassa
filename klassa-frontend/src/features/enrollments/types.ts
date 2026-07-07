export type EnrollmentStatus = 'ACTIVE' | 'WITHDRAWN' | 'TRANSFERRED'

export interface EnrollmentResponse {
  id: number
  studentId: number
  studentName: string
  studentCode: string
  sectionId: number
  sectionName: string
  enrolledAt: string
  status: EnrollmentStatus
}

export interface EnrollStudentInput {
  studentId: number
  sectionId: number
}
