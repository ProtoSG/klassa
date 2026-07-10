import { z } from 'zod'

export const CALENDAR_EVENT_TYPES = [
  'EXAM',
  'HOLIDAY',
  'PARENT_TEACHER_MEETING',
  'GRADING_DEADLINE',
  'SCHOOL_ACTIVITY',
] as const

export const createCalendarEventSchema = z
  .object({
    title: z.string().min(1, 'Requerido'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'Requerido'),
    endDate: z.string().min(1, 'Requerido'),
    type: z.enum(CALENDAR_EVENT_TYPES),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
    path: ['endDate'],
  })

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>
