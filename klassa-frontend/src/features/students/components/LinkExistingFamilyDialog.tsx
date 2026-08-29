'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog } from '@/shared/components/Dialog'
import { Button } from '@/components/ui/button'
import { updateStudent } from '../actions'
import SiblingSearchPicker from './SiblingSearchPicker'
import type { StudentResponse, FamilyResponse } from '../types'

interface Props {
  student: StudentResponse
  /** Pass the student's current family to switch to link/replace mode — shown as a link/edit action on students that already have one, instead of the empty-state action. */
  currentFamily?: FamilyResponse | null
}

export default function LinkExistingFamilyDialog({ student, currentFamily = null }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<StudentResponse | null>(null)
  const [isLinking, startLink] = useTransition()
  const router = useRouter()

  function handleClose() {
    if (isLinking) return
    setOpen(false)
    setSelected(null)
  }

  function handleLink() {
    if (!selected || selected.familyId === null) return
    startLink(async () => {
      try {
        await updateStudent(
          student.id,
          { firstName: student.firstName, lastName: student.lastName, birthDate: student.birthDate, gender: student.gender, photoUrl: student.photoUrl },
          selected.familyId,
        )
        toast.success(
          currentFamily
            ? `Familia reemplazada por la de ${selected.fullName}`
            : `Vinculado a la familia de ${selected.fullName}`,
        )
        handleClose()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al vincular')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink/70 hover:text-ink underline underline-offset-2 transition-colors"
      >
        {currentFamily ? 'Vincular con otra familia existente' : 'Vincular con la familia de otro alumno'}
      </button>

      <Dialog open={open} onClose={handleClose} title="Vincular familia existente" className="max-w-sm">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-ghost -mt-1">
            Busca a un hermano o hermana ya registrado — este alumno pasará a compartir su misma familia y apoderado.
          </p>

          {currentFamily && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5">
              <p className="text-xs text-ink">
                Esto reemplaza la familia actual (<span className="font-medium">{currentFamily.guardianName}</span>).
                Esos datos no se borran, pero este alumno deja de estar vinculado a ellos.
              </p>
            </div>
          )}

          <SiblingSearchPicker excludeStudentId={student.id} selected={selected} onSelect={setSelected} />

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isLinking}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleLink} disabled={!selected || isLinking}>
              {isLinking ? 'Vinculando...' : currentFamily ? 'Reemplazar' : 'Vincular'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
