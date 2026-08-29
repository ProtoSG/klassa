'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { updateSection } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Button } from '@/components/ui/button'
import type { SectionResponse } from '../types'
import type { UserResponse } from '@/features/users/types'

interface Props {
  section: SectionResponse
  teachers: UserResponse[]
}

export default function AssignHomeroomTeacherDialog({ section, teachers }: Props) {
  const [open, setOpen] = useState(false)
  const [teacherId, setTeacherId] = useState<number | ''>(section.homeroomTeacherId ?? '')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setTeacherId(section.homeroomTeacherId ?? '')
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await updateSection(section.id, {
          name: section.name,
          gradeLevelId: section.gradeLevelId,
          academicYearId: section.academicYearId,
          maxCapacity: section.maxCapacity,
          homeroomTeacherId: teacherId === '' ? null : teacherId,
        })
        toast.success('Profesor tutor actualizado')
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al asignar profesor')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Asignar profesor tutor"
        className="p-1 rounded-lg text-ghost hover:text-ink hover:bg-surface transition-colors duration-150"
      >
        <Pencil size={13} />
      </button>

      <Dialog open={open} onClose={handleClose} title="Profesor tutor" className="max-w-sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-prose mb-1.5 block">
              Sección {section.name}
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70"
            >
              <option value="">Sin asignar</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
