import { z } from 'zod'

export const newTenantSchema = z.object({
  subdomain: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  name: z.string().min(1, 'Requerido').max(200),
  planId: z.number().min(1, 'Selecciona un plan'),
  trialDays: z.number().min(0).max(365).optional(),
  adminEmail: z.string().email('Email inválido'),
  adminFirstName: z.string().min(1, 'Requerido'),
  adminLastName: z.string().min(1, 'Requerido'),
})

export type NewTenantInput = z.infer<typeof newTenantSchema>
