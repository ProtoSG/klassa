'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createSectionSchema, type CreateSectionInput } from '../schemas'
import { createSection } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { GradeLevel } from '@/features/grade-levels/types'
import type { UserResponse } from '@/features/users/types'

interface Props {
  academicYearId: number
  gradeLevels: GradeLevel[]
  teachers: UserResponse[]
}

export default function NewSectionDialog({ academicYearId, gradeLevels, teachers }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<CreateSectionInput>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: { name: '', gradeLevelId: 0, academicYearId, homeroomTeacherId: null, maxCapacity: 30 },
    mode: 'onTouched',
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
    form.reset()
  }

  function onSubmit(values: CreateSectionInput) {
    startTransition(async () => {
      try {
        await createSection(values)
        toast.success('Sección creada')
        handleClose()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear la sección')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        + Nueva sección
      </button>

      <Dialog open={open} onClose={handleClose} title="Nueva sección" className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl><Input placeholder="10mo A" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="gradeLevelId" render={({ field }) => (
              <FormItem>
                <FormLabel>Grado</FormLabel>
                <FormControl>
                  <select value={field.value || ''} onChange={(e) => field.onChange(Number(e.target.value))} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70">
                    <option value="">Seleccionar grado</option>
                    {gradeLevels.map((gl) => <option key={gl.id} value={gl.id}>{gl.name}</option>)}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="maxCapacity" render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidad máxima</FormLabel>
                <FormControl><Input type="number" min={1} max={100} {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="homeroomTeacherId" render={({ field }) => (
              <FormItem>
                <FormLabel>Profesor tutor <span className="text-ghost font-normal">(opcional)</span></FormLabel>
                <FormControl>
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70"
                  >
                    <option value="">Sin asignar</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Creando...' : 'Crear'}</Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
