'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { generateMonthlyInvoices } from '../actions'
import type { FeeScheduleResponse } from '../types'

const schema = z.object({
  feeScheduleId: z.string().min(1, 'Selecciona un arancel'),
  dueDate: z.string().min(1, 'Requerido'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  academicYearId: number
  feeSchedules: FeeScheduleResponse[]
  onGenerated: () => void
}

export default function GenerateMonthlyDialog({ academicYearId, feeSchedules, onGenerated }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { feeScheduleId: '', dueDate: today },
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
        await generateMonthlyInvoices({
          academicYearId,
          feeScheduleId: parseInt(values.feeScheduleId),
          dueDate: values.dueDate,
        })
        toast.success('Mensualidades generadas')
        onGenerated()
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al generar mensualidades')
      }
    })
  }

  const activeSchedules = feeSchedules.filter((s) => s.active)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 border border-line bg-white text-ink text-sm font-medium px-4 py-2 rounded-xl hover:border-ink/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      >
        Generar mensualidades
      </button>

      <Dialog open={open} onClose={handleClose} title="Generar mensualidades" description="Crea facturas para todos los alumnos activos del año académico." className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="feeScheduleId" render={({ field }) => (
              <FormItem>
                <FormLabel>Arancel</FormLabel>
                <FormControl>
                  <select {...field} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70">
                    <option value="">Seleccionar arancel</option>
                    {activeSchedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.concept} — S/ {s.amount}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de vencimiento</FormLabel>
                <FormControl>
                  <input type="date" {...field} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Generando...' : 'Generar'}</Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
