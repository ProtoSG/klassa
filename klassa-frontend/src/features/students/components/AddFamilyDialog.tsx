'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateFamilySchema, type UpdateFamilyInput } from '../schemas'
import { addFamily } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { StudentResponse } from '../types'

interface Props {
  student: StudentResponse
}

export default function AddFamilyDialog({ student }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<UpdateFamilyInput>({
    resolver: zodResolver(updateFamilySchema),
    defaultValues: {
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
    },
    mode: 'onTouched',
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
    form.reset()
  }

  function onSubmit(values: UpdateFamilyInput) {
    startTransition(async () => {
      try {
        await addFamily(student, values)
        toast.success('Información familiar agregada')
        handleClose()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al agregar la familia')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink/70 hover:text-ink underline underline-offset-2 transition-colors"
      >
        + Agregar información familiar
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        title="Agregar información familiar"
        className="max-w-md"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="guardianName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del acudiente</FormLabel>
                <FormControl><Input placeholder="Carlos Pérez" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="guardianEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="carlos@mail.com" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guardianPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl><Input placeholder="999123456" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl><Input placeholder="Av. Los Álamos 123" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contacto de emergencia</FormLabel>
                  <FormControl><Input placeholder="Rosa Pérez" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="emergencyPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tel. de emergencia</FormLabel>
                  <FormControl><Input placeholder="987654321" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Agregar'}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
