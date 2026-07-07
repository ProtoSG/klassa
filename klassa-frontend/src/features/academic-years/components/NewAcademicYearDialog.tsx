'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createAcademicYearSchema, type CreateAcademicYearInput } from '../schemas'
import { createAcademicYear } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function NewAcademicYearDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateAcademicYearInput>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: { name: '', startDate: '', endDate: '' },
    mode: 'onTouched',
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
    form.reset()
  }

  function onSubmit(values: CreateAcademicYearInput) {
    startTransition(async () => {
      try {
        await createAcademicYear(values)
        toast.success('Año académico creado')
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear el año académico')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        + Nuevo año
      </button>

      <Dialog open={open} onClose={handleClose} title="Nuevo año académico" className="max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl><Input placeholder="2025" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha inicio</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha fin</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Creando...' : 'Crear año'}</Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
