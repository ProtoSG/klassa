'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createGradeLevelSchema, type CreateGradeLevelInput } from '../schemas'
import { createGradeLevel } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const LEVEL_OPTIONS = [
  { value: 'INITIAL', label: 'Inicial' },
  { value: 'PRIMARY', label: 'Primaria' },
  { value: 'SECONDARY', label: 'Secundaria' },
]

export default function NewGradeLevelDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<CreateGradeLevelInput>({
    resolver: zodResolver(createGradeLevelSchema),
    defaultValues: { name: '', level: 'PRIMARY', sortOrder: 0 },
    mode: 'onTouched',
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
    form.reset()
  }

  function onSubmit(values: CreateGradeLevelInput) {
    startTransition(async () => {
      try {
        await createGradeLevel(values)
        toast.success('Grado creado')
        handleClose()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear el grado')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ghost hover:text-ink transition-colors"
      >
        + Agregar
      </button>

      <Dialog open={open} onClose={handleClose} title="Nuevo grado" className="max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl><Input placeholder="1ro Primaria" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="level" render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel</FormLabel>
                <FormControl>
                  <select value={field.value} onChange={field.onChange} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70">
                    {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
