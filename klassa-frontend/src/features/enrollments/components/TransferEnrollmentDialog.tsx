'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowRightLeft } from 'lucide-react'
import { Dialog } from '@/shared/components/Dialog'
import { Button } from '@/components/ui/button'
import { transferEnrollment, fetchSectionsForTransfer } from '../actions'
import type { EnrollmentResponse } from '../types'
import type { SectionResponse } from '@/features/sections/types'

interface Props {
  enrollment: EnrollmentResponse | null
  open: boolean
  onClose: () => void
  onTransferred: (oldEnrollmentId: number, newEnrollment: EnrollmentResponse) => void
}

export default function TransferEnrollmentDialog({ enrollment, open, onClose, onTransferred }: Props) {
  const [sections, setSections] = useState<SectionResponse[]>([])
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && enrollment) {
      setSelectedSectionId(null)
      setIsLoadingSections(true)
      fetchSectionsForTransfer(enrollment.sectionId)
        .then(setSections)
        .catch(() => setSections([]))
        .finally(() => setIsLoadingSections(false))
    }
  }, [open, enrollment])

  function handleClose() {
    if (isPending) return
    onClose()
    setSelectedSectionId(null)
    setSections([])
  }

  function handleSubmit() {
    if (!enrollment || !selectedSectionId) return
    startTransition(async () => {
      try {
        const newEnrollment = await transferEnrollment(enrollment.id, selectedSectionId)
        toast.success(`${enrollment.studentName} trasladado a ${newEnrollment.sectionName}`)
        onTransferred(enrollment.id, newEnrollment)
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al transferir')
      }
    })
  }

  const selectedSection = sections.find((s) => s.id === selectedSectionId)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Trasladar alumno"
      description={enrollment ? `${enrollment.studentName} · actualmente en ${enrollment.sectionName}` : undefined}
      className="max-w-sm"
    >
      <div className="flex flex-col gap-4">
        {isLoadingSections ? (
          <p className="text-sm text-ghost py-4 text-center">Cargando secciones...</p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-ghost py-4 text-center">
            No hay otras secciones disponibles en este año académico.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-prose">Sección destino</label>
              <div className="flex flex-col gap-1 max-h-52 overflow-y-auto rounded-xl border border-line">
                {sections.map((s) => {
                  const full = s.activeEnrollments >= s.maxCapacity
                  const selected = selectedSectionId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={full}
                      onClick={() => setSelectedSectionId(s.id)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-line last:border-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                        selected
                          ? 'bg-ink text-white'
                          : 'hover:bg-surface text-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{s.name}</span>
                        <span className={`text-xs ${selected ? 'text-white/60' : 'text-ghost'}`}>
                          {s.activeEnrollments}/{s.maxCapacity}
                          {full && ' · lleno'}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${selected ? 'text-white/60' : 'text-prose'}`}>
                        {s.gradeLevelName}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedSection && (
              <div className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
                <ArrowRightLeft size={14} className="text-warning shrink-0" />
                <p className="text-xs text-warning">
                  <span className="font-medium">{enrollment?.sectionName}</span>
                  {' → '}
                  <span className="font-medium">{selectedSection.name}</span>
                  {'. '}
                  La matrícula actual quedará como Trasladado.
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending || !selectedSectionId || sections.length === 0}
            onClick={handleSubmit}
          >
            {isPending ? 'Trasladando...' : 'Confirmar traslado'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
