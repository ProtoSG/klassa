export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED'

export interface AttendanceResponse {
  id: number
  enrollmentId: number
  studentName: string
  date: string
  status: AttendanceStatus
  note: string | null
  registeredById: number
}

export interface AttendancePercentageResponse {
  enrollmentId: number
  startDate: string
  endDate: string
  totalDays: number
  attendedDays: number
  percentage: string
}
