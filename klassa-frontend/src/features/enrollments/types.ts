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
  /** Populated by AcademicMapper when the student's family is loaded. Used by the
   *  attendance screen's "notify absentees via WhatsApp" panel. */
  guardianName?: string | null
  guardianPhone?: string | null
}

export interface EnrollStudentInput {
  studentId: number
  sectionId: number
}
