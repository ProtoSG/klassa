import { z } from 'zod'

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  gradeLevelId: z.number().min(1, 'Requerido'),
  hoursPerWeek: z.number().int().min(1).max(20).optional(),
})

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
