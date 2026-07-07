'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createScoreSchema, type CreateScoreInput } from '../schemas'
import { saveScore } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Subject } from '@/features/subjects/types'

interface Props {
  enrollmentId: number
  subjects: Subject[]
}

export default function NewScoreDialog({ enrollmentId, subjects }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<CreateScoreInput>({
    resolver: zodResolver(createScoreSchema),
    defaultValues: { enrollmentId, subjectId: 0, period: 1, score: '' },
    mode: 'onTouched',
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
    form.reset()
  }

  function onSubmit(values: CreateScoreInput) {
    startTransition(async () => {
      try {
        await saveScore({ ...values, enrollmentId })
        toast.success('Nota guardada')
        handleClose()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar la nota')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        + Registrar nota
      </button>

      <Dialog open={open} onClose={handleClose} title="Registrar nota" className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="subjectId" render={({ field }) => (
              <FormItem>
                <FormLabel>Materia</FormLabel>
                <FormControl>
                  <select value={field.value || ''} onChange={(e) => field.onChange(Number(e.target.value))} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70">
                    <option value="">Seleccionar materia</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="period" render={({ field }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <FormControl>
                    <select value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70">
                      <option value={1}>1er Período</option>
                      <option value={2}>2do Período</option>
                      <option value={3}>3er Período</option>
                      <option value={4}>4to Período</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="score" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota (0-20)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min={0} max={20} placeholder="15.50" {...field} /></FormControl>
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
