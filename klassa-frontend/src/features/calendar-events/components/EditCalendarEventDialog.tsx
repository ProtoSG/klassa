'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { createCalendarEventSchema, CALENDAR_EVENT_TYPES, type CreateCalendarEventInput } from '../schemas'
import { updateCalendarEvent } from '../actions'
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
  event: CalendarEvent
  onUpdated: (event: CalendarEvent) => void
}

export default function EditCalendarEventDialog({ event, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateCalendarEventInput>({
    resolver: zodResolver(createCalendarEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description ?? '',
      startDate: event.startDate,
      endDate: event.endDate,
      type: event.type,
    },
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
  }

  function onSubmit(values: CreateCalendarEventInput) {
    startTransition(async () => {
      try {
        const updated = await updateCalendarEvent(event.id, values)
        onUpdated(updated)
        toast.success('Evento actualizado')
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al actualizar el evento')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Editar evento"
        className="p-1.5 rounded-lg text-ghost hover:text-ink hover:bg-surface transition-colors duration-150"
      >
        <Pencil size={14} />
      </button>

      <Dialog open={open} onClose={handleClose} title="Editar evento" className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
