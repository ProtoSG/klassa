'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createUser } from '@/features/users/actions'
import type { FamilyResponse } from '../types'

// Matches backend UserRequest.password (@Size(min = 8, max = 100)) — a
// weaker client-side minimum here would let the form submit and then fail
// with a raw 400 from the backend instead of a field-level message.
const schema = z.object({
  firstName: z.string().min(1, 'Requerido').max(100),
  lastName: z.string().min(1, 'Requerido').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mín. 8 caracteres').max(100),
})

type FormValues = z.infer<typeof schema>

export default function CreateParentAccessDialog({ family }: { family: FamilyResponse }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    // Not pre-split from guardianName: "first token = first name" breaks on
    // compound Spanish given names (e.g. "María José García López"), and a
    // wrong silent guess is worse than making the admin type it — they
    // already have the full name visible right above in the family card.
    defaultValues: { firstName: '', lastName: '', email: family.guardianEmail ?? '', password: '' },
    mode: 'onTouched',
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
    form.reset()
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createUser({ ...values, role: 'PARENT', familyId: family.id })
        toast.success('Acceso creado — ya puede iniciar sesión en el portal')
        handleClose()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear el acceso')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink/70 hover:text-ink underline underline-offset-2 transition-colors"
      >
        + Crear acceso al portal
      </button>

      <Dialog open={open} onClose={handleClose} title="Crear acceso para el acudiente" className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-xs text-ghost -mt-1">
              Crea un usuario con rol Padre/Apoderado vinculado a esta familia — podrá ver notas, asistencia y cobros de sus hijos en el portal.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Carlos" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl><Input placeholder="Pérez" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="carlos@mail.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Mín. 8 caracteres" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Creando...' : 'Crear acceso'}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
