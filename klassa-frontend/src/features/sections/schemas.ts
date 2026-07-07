import { z } from 'zod'

export const createSectionSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  gradeLevelId: z.number().min(1, 'Requerido'),
  academicYearId: z.number().min(1, 'Requerido'),
  homeroomTeacherId: z.number().nullable().optional(),
  maxCapacity: z.number().int().min(1).max(100).optional(),
})

export type CreateSectionInput = z.infer<typeof createSectionSchema>
