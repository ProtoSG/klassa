export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED'
export type Gender = 'M' | 'F' | 'O'

export interface StudentResponse {
  id: number
  code: string
  firstName: string
  lastName: string
  fullName: string
  birthDate: string
  gender: Gender
  status: StudentStatus
  familyId: number
  guardianName: string
  /** Populated from student.family.guardianPhone when a family exists. Used by the
   *  WhatsApp integration (attendance absence notification + billing payment reminder). */
  guardianPhone: string | null
  photoUrl: string | null
}

export interface FamilyResponse {
  id: number
  guardianName: string
  guardianEmail: string | null
  guardianPhone: string | null
  address: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  /** Email of the User account linked as this family's PARENT login, or null if none yet. */
  linkedUserEmail: string | null
}

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

export interface UpdateStudentInput {
  firstName: string
  lastName: string
  birthDate: string
  gender: Gender
  familyId: number | null
  photoUrl: string | null
}

export interface UpdateFamilyInput {
  guardianName: string
  guardianEmail: string | null
  guardianPhone: string | null
  address: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface ImportRowError {
  rowNumber: number
  field: string
  message: string
}

export interface ImportResult {
  totalRows: number
  successCount: number
  failureCount: number
  errors: ImportRowError[]
}
