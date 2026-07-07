'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createFeeSchedule } from '../actions'
import type { FeeScheduleResponse } from '../types'

const schema = z.object({
  concept: z.string().min(1, 'Requerido').max(200),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Monto inválido'),
  dueDay: z.string().refine((v) => {
    const n = parseInt(v)
    return !isNaN(n) && n >= 1 && n <= 31
  }, 'Día entre 1 y 31'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  academicYearId: number
  onCreated: (schedule: FeeScheduleResponse) => void
}

export default function NewFeeScheduleDialog({ academicYearId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { concept: '', amount: '', dueDay: '10' },
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
        const created = await createFeeSchedule({
          concept: values.concept,
          amount: parseFloat(values.amount),
          dueDay: parseInt(values.dueDay),
          academicYearId,
        })
        toast.success('Arancel creado')
        onCreated(created)
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear arancel')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        + Nuevo arancel
      </button>

      <Dialog open={open} onClose={handleClose} title="Nuevo arancel" className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="concept" render={({ field }) => (
              <FormItem>
                <FormLabel>Concepto</FormLabel>
                <FormControl><Input placeholder="Mensualidad" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto (S/)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="0.01" placeholder="350.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dueDay" render={({ field }) => (
                <FormItem>
                  <FormLabel>Día de venc.</FormLabel>
                  <FormControl><Input type="number" min={1} max={31} placeholder="10" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
