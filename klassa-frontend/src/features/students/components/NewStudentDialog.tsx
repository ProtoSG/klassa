'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { newStudentSchema, type NewStudentInput } from '../schemas'
import { createStudent, uploadStudentPhoto } from '../actions'
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
import SiblingSearchPicker from './SiblingSearchPicker'
import type { StudentResponse } from '../types'

const STEPS = [
  { label: 'Alumno',     fields: ['firstName', 'lastName', 'birthDate', 'gender'] },
  { label: 'Acudiente',  fields: ['guardianName', 'guardianEmail', 'guardianPhone', 'address'] },
  { label: 'Emergencia', fields: [] },
] as const

// Step 1's required fields depend on guardianMode — see newStudentSchema's superRefine.
const GUARDIAN_STEP_FIELDS = {
  new: ['guardianName', 'guardianEmail', 'guardianPhone', 'address'] as const,
  existing: ['existingFamilyId'] as const,
}

export default function NewStudentDialog() {
  const [open, setOpen]         = useState(false)
  const [step, setStep]         = useState(0)
  const [photo, setPhoto]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef            = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  // Set once `createStudent` succeeds. From that point on the student already exists — if the
  // photo upload then fails, we must NOT let the user resubmit the form (that would create a
  // second Family+Student for the same person). Instead we lock the form and only offer to
  // retry the photo or finish without one.
  const [createdStudentId, setCreatedStudentId] = useState<number | null>(null)
  const [selectedSibling, setSelectedSibling] = useState<StudentResponse | null>(null)

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
      firstName: '', lastName: '',
      birthDate: '', gender: 'M',
      guardianMode: 'new',
      guardianName: '', guardianEmail: '',
      guardianPhone: '', address: '',
      existingFamilyId: null,
      emergencyContact: '', emergencyPhone: '',
    },
    mode: 'onTouched',
  })
  const guardianMode = form.watch('guardianMode')

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setStep(0)
    setCreatedStudentId(null)
    setSelectedSibling(null)
    form.reset()
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleNext() {
    const fields = step === 1
      ? GUARDIAN_STEP_FIELDS[form.getValues('guardianMode')]
      : STEPS[step].fields
    const ok = fields.length === 0 || await form.trigger([...fields] as (keyof NewStudentInput)[])
    if (ok) setStep((s) => s + 1)
  }

  // Steps 0/1's required fields are enough to pass the whole schema (step 2's emergency fields
  // are optional), so pressing Enter in any earlier step would otherwise trigger a native form
  // submit that creates the student before the user ever reaches the emergency step. Treat Enter
  // as "Siguiente" on non-final steps instead of letting it implicitly submit.
  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
    if (step < STEPS.length - 1) {
      e.preventDefault()
      handleNext()
    }
  }

  async function uploadPhoto(studentId: number) {
    if (!photo) return
    const fd = new FormData()
    fd.append('file', photo)
    await uploadStudentPhoto(studentId, fd)
  }

  function onSubmit(values: NewStudentInput) {
    startTransition(async () => {
      let student
      try {
        student = await createStudent(values)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear el alumno')
        return
      }
      // The student now exists — any error past this point must not offer "Crear alumno" again.
      setCreatedStudentId(student.id)
      try {
        await uploadPhoto(student.id)
      } catch (err) {
        toast.error(
          `${err instanceof Error ? err.message : 'Error al subir la foto'}. El alumno ya se creó — reintenta subir la foto o continúa sin ella.`
        )
        return
      }
      toast.success('Alumno creado')
      handleClose()
    })
  }

  function handleRetryPhoto() {
    if (!createdStudentId) return
    startTransition(async () => {
      try {
        await uploadPhoto(createdStudentId)
        toast.success('Foto subida')
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al subir la foto')
      }
    })
  }

  function handleSkipPhoto() {
    toast.success('Alumno creado')
    handleClose()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        + Nuevo alumno
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        title="Nuevo alumno"
        className="max-w-md"
      >
        {createdStudentId ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-prose">
              El alumno ya se creó, pero la foto no se pudo subir. Puedes reintentarlo o continuar sin foto.
            </p>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleSkipPhoto} disabled={isPending}>
                Continuar sin foto
              </Button>
              <Button type="button" size="sm" onClick={handleRetryPhoto} disabled={isPending}>
                {isPending ? 'Subiendo...' : 'Reintentar foto'}
              </Button>
            </div>
          </div>
        ) : (
        <>
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
          <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="flex flex-col gap-4">

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
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center hover:bg-danger/90 transition-colors"
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

                <div className="grid grid-cols-2 gap-3">
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
                {/* Every student needs a guardian — this just picks whether it's a new one
                    or an existing one already in the system (e.g. a sibling's guardian). */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted-fill">
                  {(['new', 'existing'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        form.setValue('guardianMode', mode)
                        if (mode === 'new') {
                          setSelectedSibling(null)
                          form.setValue('existingFamilyId', null)
                        }
                      }}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        guardianMode === mode
                          ? 'bg-white text-ink shadow-card'
                          : 'text-ghost hover:text-ink'
                      }`}
                    >
                      {mode === 'new' ? 'Nuevo apoderado' : 'Apoderado existente'}
                    </button>
                  ))}
                </div>

                {guardianMode === 'new' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <p className="text-xs text-ghost -mt-1">
                      Busca a un hermano o hermana ya registrado — este alumno compartirá su misma familia y apoderado.
                    </p>
                    <SiblingSearchPicker
                      selected={selectedSibling}
                      onSelect={(s) => {
                        setSelectedSibling(s)
                        form.setValue('existingFamilyId', s.familyId, { shouldValidate: true })
                      }}
                    />
                    <FormField control={form.control} name="existingFamilyId" render={() => <FormMessage />} />
                  </>
                )}
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
        </>
        )}
      </Dialog>
    </>
  )
}
