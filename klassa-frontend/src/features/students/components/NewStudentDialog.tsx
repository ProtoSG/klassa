'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { newStudentSchema, type NewStudentInput } from '../schemas'
import { createStudent } from '../actions'
import { useSession } from '@/shared/store/session'
import { Dialog } from '@/shared/components/Dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const STEPS = [
  { label: 'Alumno',     fields: ['firstName', 'lastName', 'code', 'birthDate', 'gender'] },
  { label: 'Acudiente',  fields: ['guardianName', 'guardianEmail', 'guardianPhone', 'address'] },
  { label: 'Emergencia', fields: [] },
] as const

type StepFields = typeof STEPS[number]['fields'][number]

export default function NewStudentDialog() {
  const [open, setOpen]         = useState(false)
  const [step, setStep]         = useState(0)
  const [photo, setPhoto]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef            = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const subdomain = useSession((s) => s.subdomain)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handlePhotoRemove() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const form = useForm<NewStudentInput>({
    resolver: zodResolver(newStudentSchema),
    defaultValues: {
      code: '', firstName: '', lastName: '',
      birthDate: '', gender: 'M',
      guardianName: '', guardianEmail: '',
      guardianPhone: '', address: '',
      emergencyContact: '', emergencyPhone: '',
    },
    mode: 'onTouched',
  })

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setStep(0)
    form.reset()
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleNext() {
    const fields = STEPS[step].fields as unknown as StepFields[]
    const ok = fields.length === 0 || await form.trigger(fields)
    if (ok) setStep((s) => s + 1)
  }

  function onSubmit(values: NewStudentInput) {
    startTransition(async () => {
      try {
        const student = await createStudent(values)
        if (photo) {
          const fd = new FormData()
          fd.append('file', photo)
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/students/${student.id}/photo`,
            {
              method: 'PATCH',
              credentials: 'include',
              headers: subdomain ? { 'X-Tenant-Subdomain': subdomain } : {},
              body: fd,
            }
          )
          if (!res.ok) {
            const err = await res.json().catch(() => null)
            throw new Error(err?.message ?? `Error ${res.status}`)
          }
        }
        toast.success('Alumno creado')
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear el alumno')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        + Nuevo alumno
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        title="Nuevo alumno"
        className="max-w-md"
      >
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-6">
          {STEPS.map((s, i) => {
            const done    = i < step
            const active  = i === step
            return (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                      done   && 'bg-accent text-ink',
                      active && 'bg-ink text-white ring-4 ring-ink/10',
                      !done && !active && 'bg-muted-fill text-ghost border border-line',
                    )}
                  >
                    {done ? <Check size={13} strokeWidth={2.5} /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-xs whitespace-nowrap transition-colors duration-200',
                    active ? 'text-ink font-medium' : 'text-ghost',
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'h-px flex-1 mx-2 mb-4 transition-colors duration-300',
                    i < step ? 'bg-accent' : 'bg-line',
                  )} />
                )}
              </div>
            )
          })}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* Step 0 — Alumno */}
            {step === 0 && (
              <div className="flex flex-col gap-3">
                {/* Photo picker */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-full bg-muted-fill flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-line hover:border-ink/30 transition-colors"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={20} className="text-ghost" />
                      )}
                    </div>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={handlePhotoRemove}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                  <span className="text-xs text-ghost">Foto de perfil (opcional)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl><Input placeholder="Lucía" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl><Input placeholder="Pérez" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl><Input placeholder="EST-001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="birthDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nacimiento</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género</FormLabel>
                      <FormControl>
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent transition-all duration-200"
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                          <option value="O">Otro</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}

            {/* Step 1 — Acudiente */}
            {step === 1 && (
              <div className="flex flex-col gap-3">
                <FormField control={form.control} name="guardianName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl><Input placeholder="Carlos Pérez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="guardianEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="carlos@mail.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="guardianPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl><Input placeholder="999123456" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Dirección{' '}
                      <span className="text-ghost font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl><Input placeholder="Av. Los Álamos 123" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {/* Step 2 — Emergencia */}
            {step === 2 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-ghost">
                  Datos opcionales. Se usarán en caso de emergencia si no se logra contactar al acudiente principal.
                </p>
                <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de contacto</FormLabel>
                    <FormControl><Input placeholder="Rosa Pérez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="emergencyPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de emergencia</FormLabel>
                    <FormControl><Input placeholder="987654321" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

              </div>
            )}

            {/* Navigation */}
            <div className={cn('flex gap-2 pt-1', step > 0 ? 'justify-between' : 'justify-end')}>
              {step > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setStep(s => s - 1)} disabled={isPending}>
                  ← Atrás
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" size="sm" onClick={handleNext}>
                  Siguiente →
                </Button>
              ) : (
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Crear alumno'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  )
}
