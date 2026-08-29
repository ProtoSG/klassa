'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createUser, updateUser } from '../actions'
import { ROLE_LABEL } from './UserRoleBadge'
import type { UserResponse, UserRole } from '../types'

const ROLES: UserRole[] = ['ADMIN', 'TEACHER', 'TREASURER', 'PARENT']

const schema = z.object({
  firstName: z.string().min(1, 'Requerido').max(100),
  lastName: z.string().min(1, 'Requerido').max(100),
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'TEACHER', 'TREASURER', 'PARENT']),
  password: z.string().max(100),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (user: UserResponse) => void
  user?: UserResponse
}

export default function UserFormDialog({ open, onClose, onSaved, user }: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!user

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', role: 'TEACHER', password: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        user
          ? { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, password: '' }
          : { firstName: '', lastName: '', email: '', role: 'TEACHER', password: '' },
      )
    }
  }, [open, user]) // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: FormValues) {
    if (!isEdit && values.password.length < 8) {
      form.setError('password', { message: 'Mín. 8 caracteres' })
      return
    }
    if (isEdit && values.password !== '' && values.password.length < 8) {
      form.setError('password', { message: 'Mín. 8 caracteres' })
      return
    }

    startTransition(async () => {
      try {
        const saved = isEdit
          ? await updateUser(user.id, {
              email: values.email,
              password: values.password === '' ? null : values.password,
              role: values.role,
              firstName: values.firstName,
              lastName: values.lastName,
            })
          : await createUser({
              email: values.email,
              password: values.password,
              role: values.role,
              firstName: values.firstName,
              lastName: values.lastName,
            })
        toast.success(isEdit ? 'Usuario actualizado' : 'Usuario creado')
        onSaved(saved)
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      className="max-w-sm"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl><Input placeholder="Ana" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl><Input placeholder="García" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="ana@colegio.edu" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <FormControl>
                <select {...field} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contraseña
                {isEdit && <span className="ml-1 text-ghost font-normal text-xs">(vacío = sin cambio)</span>}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isEdit ? '••••••' : 'Mín. 8 caracteres'}
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Form>
    </Dialog>
  )
}
