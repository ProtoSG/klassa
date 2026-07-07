import { z } from 'zod'

export const loginSchema = z.object({
  subdomain: z
    .string()
    .min(1, 'Requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Requerido'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerido'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string().min(1, 'Requerido'),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

export const platformLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Requerido'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type PlatformLoginInput = z.infer<typeof platformLoginSchema>
