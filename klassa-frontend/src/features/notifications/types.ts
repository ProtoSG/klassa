export interface NotificationResponse {
  id: number
  type: string
  title: string
  message: string
  studentId: number | null
  studentName: string | null
  read: boolean
  createdAt: string
}
