export type CalendarEventType =
  | 'EXAM'
  | 'HOLIDAY'
  | 'PARENT_TEACHER_MEETING'
  | 'GRADING_DEADLINE'
  | 'SCHOOL_ACTIVITY'

export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  startDate: string
  endDate: string
  type: CalendarEventType
}

export interface CreateCalendarEventInput {
  title: string
  description?: string
  startDate: string
  endDate: string
  type: CalendarEventType
}
