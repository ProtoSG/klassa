import { z } from 'zod'

export const createScoreSchema = z.object({
  enrollmentId: z.number().min(1, 'Requerido'),
  subjectId: z.number().min(1, 'Requerido'),
  period: z.number().int().min(1).max(4),
  score: z.string().refine((val) => {
    const n = parseFloat(val)
    return !isNaN(n) && n >= 0 && n <= 20
  }, 'La nota debe estar entre 0 y 20'),
})

export type CreateScoreInput = z.infer<typeof createScoreSchema>
