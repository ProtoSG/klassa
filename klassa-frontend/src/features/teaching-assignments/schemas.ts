import { z } from 'zod'

export const assignTeacherSchema = z.object({
  subjectId: z.number().min(1, 'Requerido'),
  teacherId: z.number().min(1, 'Requerido'),
})

export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>
