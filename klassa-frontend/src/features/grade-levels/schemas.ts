import { z } from 'zod'

export const createGradeLevelSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  level: z.enum(['INITIAL', 'PRIMARY', 'SECONDARY']),
  sortOrder: z.number().int().min(0).optional(),
})

export type CreateGradeLevelInput = z.infer<typeof createGradeLevelSchema>
