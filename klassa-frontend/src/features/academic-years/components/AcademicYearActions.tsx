'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { activateAcademicYear, closeAcademicYear } from '../actions'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import type { AcademicYearResponse } from '../types'

interface Props {
  year: AcademicYearResponse
}

export default function AcademicYearActions({ year }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  function handleActivate() {
    startTransition(async () => {
      try {
        await activateAcademicYear(year.id)
        toast.success('Año activado correctamente')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al activar el año')
      }
    })
  }

  function handleClose() {
    startTransition(async () => {
      try {
        await closeAcademicYear(year.id)
        setConfirmOpen(false)
        toast.success('Año cerrado correctamente')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al cerrar el año')
      }
    })
  }

  if (year.active) {
    return (
      <>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="text-xs text-ghost hover:text-danger transition-colors disabled:opacity-50"
        >
          Cerrar
        </button>

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleClose}
          title="Cerrar año académico"
          description={`¿Estás seguro de cerrar el año "${year.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Cerrar año"
          cancelLabel="Cancelar"
          danger
          loading={isPending}
        />
      </>
    )
  }

  return (
    <button
      onClick={handleActivate}
      disabled={isPending}
      className="text-xs text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-50"
    >
      Activar
    </button>
  )
}
