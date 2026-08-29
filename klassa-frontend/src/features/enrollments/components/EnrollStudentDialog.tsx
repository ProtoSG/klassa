'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { enrollStudent } from '../actions'
import { Dialog } from '@/shared/components/Dialog'
import { Button } from '@/components/ui/button'
import type { StudentResponse } from '@/features/students/types'

interface Props {
  sectionId: number
  students: StudentResponse[]
}

export default function EnrollStudentDialog({ sectionId, students }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null)
  const router = useRouter()

  const filtered = search.length >= 2
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase()),
      )
    : []

  function handleClose() {
    if (isPending) return
    setOpen(false)
    setSearch('')
    setSelectedStudent(null)
  }

  function handleSubmit() {
    if (!selectedStudent) return
    startTransition(async () => {
      try {
        await enrollStudent({ studentId: selectedStudent.id, sectionId })
        toast.success(`${selectedStudent.fullName} matriculado`)
        handleClose()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al matricular')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
      >
        + Matricular alumno
      </button>

      <Dialog open={open} onClose={handleClose} title="Matricular alumno" className="max-w-sm">
        <div className="flex flex-col gap-4">
          {selectedStudent ? (
            <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/15 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{selectedStudent.fullName}</p>
                <p className="text-xs text-ghost mt-0.5">{selectedStudent.code}</p>
              </div>
              <button
                onClick={() => { setSelectedStudent(null); setSearch('') }}
                className="text-xs text-prose hover:text-ink underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-prose">Buscar alumno</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o código..."
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ghost focus:outline-none focus:ring-2 focus:ring-accent/70"
                autoFocus
              />
              {search.length >= 2 && (
                <div className="rounded-xl border border-line bg-white overflow-hidden max-h-52 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-ghost">Sin resultados</p>
                  ) : (
                    filtered.slice(0, 15).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSelectedStudent(s); setSearch('') }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface transition-colors border-b border-line last:border-0"
                      >
                        <span className="font-medium text-ink">{s.fullName}</span>
                        <span className="ml-2 text-xs text-ghost">{s.code}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {search.length < 2 && (
                <p className="text-xs text-ghost">Escribe al menos 2 caracteres</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending || !selectedStudent}
              onClick={handleSubmit}
            >
              {isPending ? 'Matriculando...' : 'Matricular'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
