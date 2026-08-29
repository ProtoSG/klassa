'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createCalendarEventSchema, CALENDAR_EVENT_TYPES, type CreateCalendarEventInput } from '../schemas'
import { createCalendarEvent } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from '../types'

const TYPE_LABELS: Record<string, string> = {
  EXAM: 'Examen',
  HOLIDAY: 'Feriado',
  PARENT_TEACHER_MEETING: 'Reunión de padres',
  GRADING_DEADLINE: 'Cierre de notas',
  SCHOOL_ACTIVITY: 'Actividad escolar',
}

interface Props {
  defaultDate?: string
  onCreated: (event: CalendarEvent) => void
  trigger?: (open: () => void) => React.ReactNode
}

export default function NewCalendarEventDialog({ defaultDate, onCreated, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateCalendarEventInput>({
    resolver: zodResolver(createCalendarEventSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: defaultDate ?? '',
      endDate: defaultDate ?? '',
      type: 'SCHOOL_ACTIVITY',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: '',
        description: '',
        startDate: defaultDate ?? '',
        endDate: defaultDate ?? '',
        type: 'SCHOOL_ACTIVITY',
      })
    }
  }, [open, defaultDate, form])

  function handleClose() {
    if (isPending) return
    setOpen(false)
  }

  function onSubmit(values: CreateCalendarEventInput) {
    startTransition(async () => {
      try {
        const event = await createCalendarEvent(values)
        onCreated(event)
        toast.success('Evento creado')
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear el evento')
      }
    })
  }

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
        >
          + Nuevo evento
        </button>
      )}

      <Dialog open={open} onClose={handleClose} title="Nuevo evento" className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl><Input placeholder="Examen de Matemáticas" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Desde</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasta</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70"
                  >
                    {CALENDAR_EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción <span className="text-ghost font-normal">(opcional)</span></FormLabel>
                <FormControl><Input placeholder="Detalles adicionales" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
