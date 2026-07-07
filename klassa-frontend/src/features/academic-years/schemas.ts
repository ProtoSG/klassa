import { z } from 'zod'

export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  startDate: z.string().min(1, 'Requerido'),
  endDate: z.string().min(1, 'Requerido'),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['endDate'],
})

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>
