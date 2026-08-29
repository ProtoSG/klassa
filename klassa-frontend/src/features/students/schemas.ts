import { z } from 'zod'

// A student always has a guardian, but that guardian's Family row either gets
// created fresh here ('new') or is an existing one picked from a sibling
// already in the system ('existing') — see LinkExistingFamilyDialog for the
// same search reused post-creation. Only one of the two branches' fields is
// actually required, enforced below via superRefine since RHF+zodResolver
// validates the whole schema on every step/submit regardless of which step
// is showing.
export const newStudentSchema = z
  .object({
    firstName: z.string().min(1, 'Requerido'),
    lastName: z.string().min(1, 'Requerido'),
    birthDate: z.string().min(1, 'Requerido'),
    gender: z.enum(['M', 'F', 'O']),
    guardianMode: z.enum(['new', 'existing']),
    guardianName: z.string().optional(),
    guardianEmail: z.string().optional(),
    guardianPhone: z.string().optional(),
    existingFamilyId: z.number().nullable().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.guardianMode === 'existing') {
      if (!data.existingFamilyId) {
        ctx.addIssue({ code: 'custom', path: ['existingFamilyId'], message: 'Selecciona un apoderado existente' })
      }
      return
    }
    if (!data.guardianName?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['guardianName'], message: 'Requerido' })
    }
    if (!data.guardianEmail?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['guardianEmail'], message: 'Requerido' })
    } else if (!z.string().email().safeParse(data.guardianEmail).success) {
      ctx.addIssue({ code: 'custom', path: ['guardianEmail'], message: 'Email inválido' })
    }
    if (!data.guardianPhone?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['guardianPhone'], message: 'Requerido' })
    }
  })

export type NewStudentInput = z.infer<typeof newStudentSchema>

export const updateStudentSchema = z.object({
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
