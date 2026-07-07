'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { fetchScoresByEnrollment } from '../actions'
import { saveScore } from '../actions'
import ScoreTable from './ScoreTable'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createScoreSchema, type CreateScoreInput } from '../schemas'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { EnrollmentResponse } from '@/features/enrollments/types'
import type { Subject } from '@/features/subjects/types'
import type { ScoreResponse } from '../types'

interface Props {
  enrollments: EnrollmentResponse[]
  subjects: Subject[]
}

export default function SectionScores({ enrollments, subjects }: Props) {
  const [selectedId, setSelectedId] = useState<number>(enrollments[0]?.id ?? 0)
  const [scores, setScores] = useState<ScoreResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selectedEnrollment = enrollments.find((e) => e.id === selectedId)

  useEffect(() => {
    if (!selectedId) return
    setIsLoading(true)
    fetchScoresByEnrollment(selectedId)
      .then(setScores)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error cargando notas'))
      .finally(() => setIsLoading(false))
  }, [selectedId])

  const form = useForm<CreateScoreInput>({
    resolver: zodResolver(createScoreSchema),
    defaultValues: { enrollmentId: selectedId, subjectId: 0, period: 1, score: '' },
    mode: 'onTouched',
  })

  function handleDialogClose() {
    if (isPending) return
    setDialogOpen(false)
    form.reset({ enrollmentId: selectedId, subjectId: 0, period: 1, score: '' })
  }

  function onSubmit(values: CreateScoreInput) {
    startTransition(async () => {
      try {
        const saved = await saveScore({ ...values, enrollmentId: selectedId })
        setScores((prev) => {
          const idx = prev.findIndex(
            (s) => s.subjectId === saved.subjectId && s.period === saved.period,
          )
          return idx >= 0 ? prev.map((s, i) => (i === idx ? saved : s)) : [...prev, saved]
        })
        toast.success('Nota guardada')
        handleDialogClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar la nota')
      }
    })
  }

  if (enrollments.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-prose">Notas —</h2>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70"
          >
            {enrollments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.studentName}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            form.setValue('enrollmentId', selectedId)
            setDialogOpen(true)
          }}
          className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
        >
          + Registrar nota
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-ghost">Cargando notas...</p>
        </div>
      ) : (
        <ScoreTable scores={scores} />
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        title="Registrar nota"
        description={selectedEnrollment ? `Alumno: ${selectedEnrollment.studentName}` : undefined}
        className="max-w-sm"
      >
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
              <Button type="button" variant="outline" size="sm" onClick={handleDialogClose} disabled={isPending}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </Form>
      </Dialog>
    </div>
  )
}
