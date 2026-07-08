import { z } from 'zod'

export const newStudentSchema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  birthDate: z.string().min(1, 'Requerido'),
  gender: z.enum(['M', 'F', 'O']),
  guardianName: z.string().min(1, 'Requerido'),
  guardianEmail: z.string().email('Email inválido'),
  guardianPhone: z.string().min(1, 'Requerido'),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

export type NewStudentInput = z.infer<typeof newStudentSchema>

export const updateStudentSchema = z.object({
  code: z.string().min(1, 'Requerido'),
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  birthDate: z.string().min(1, 'Requerido'),
  gender: z.enum(['M', 'F', 'O']),
  photoUrl: z.string().nullable().optional(),
})

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>

export const updateFamilySchema = z.object({
  guardianName: z.string().min(1, 'Requerido'),
  guardianEmail: z.string().email('Email inválido').nullable().optional(),
  guardianPhone: z.string().min(1, 'Requerido').nullable().optional(),
  address: z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
  emergencyPhone: z.string().nullable().optional(),
})

export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>
