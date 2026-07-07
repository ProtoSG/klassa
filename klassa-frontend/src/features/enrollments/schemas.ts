import { z } from 'zod'

export const enrollStudentSchema = z.object({
  studentId: z.number().min(1, 'Requerido'),
  sectionId: z.number().min(1, 'Requerido'),
})

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>
