'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { assignTeacherSchema, type AssignTeacherInput } from '../schemas'
import { assignTeacher } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { TeachingAssignmentResponse } from '../types'
import type { Subject } from '@/features/subjects/types'
import type { UserResponse } from '@/features/users/types'

interface Props {
  sectionId: number
  subjects: Subject[]
  teachers: UserResponse[]
  onAssigned: (assignment: TeachingAssignmentResponse) => void
}

export default function NewTeachingAssignmentDialog({ sectionId, subjects, teachers, onAssigned }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<AssignTeacherInput>({
    resolver: zodResolver(assignTeacherSchema),
    defaultValues: { subjectId: 0, teacherId: 0 },
    mode: 'onTouched',
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
    form.reset()
  }

  function onSubmit(values: AssignTeacherInput) {
    startTransition(async () => {
      try {
        const assignment = await assignTeacher(sectionId, values)
        onAssigned(assignment)
        toast.success('Profesor asignado')
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al asignar profesor')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        + Asignar profesor
      </button>

      <Dialog open={open} onClose={handleClose} title="Asignar profesor" className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="subjectId" render={({ field }) => (
              <FormItem>
                <FormLabel>Materia</FormLabel>
                <FormControl>
                  <select
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70"
                  >
                    <option value="">Seleccionar materia</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="teacherId" render={({ field }) => (
              <FormItem>
                <FormLabel>Profesor</FormLabel>
                <FormControl>
                  <select
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70"
                  >
                    <option value="">Seleccionar profesor</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Asignar'}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
