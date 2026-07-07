'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowRightLeft, UserMinus } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import TransferEnrollmentDialog from './TransferEnrollmentDialog'
import { withdrawEnrollment } from '../actions'
import type { EnrollmentResponse, EnrollmentStatus } from '../types'

const STATUS_STYLE: Record<EnrollmentStatus, string> = {
  ACTIVE: 'bg-accent/30 text-ink/80',
  WITHDRAWN: 'bg-muted-fill text-prose',
  TRANSFERRED: 'bg-amber-100 text-amber-700',
}

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  ACTIVE: 'Activo',
  WITHDRAWN: 'Retirado',
  TRANSFERRED: 'Trasladado',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  initialEnrollments: EnrollmentResponse[]
}

export default function SectionEnrollments({ initialEnrollments }: Props) {
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const [transferTarget, setTransferTarget] = useState<EnrollmentResponse | null>(null)
  const [withdrawTarget, setWithdrawTarget] = useState<EnrollmentResponse | null>(null)
  const [isWithdrawing, startWithdraw] = useTransition()

  function handleTransferred(oldEnrollmentId: number, newEnrollment: EnrollmentResponse) {
    setEnrollments((prev) =>
      prev.map((e) =>
        e.id === oldEnrollmentId ? { ...e, status: 'TRANSFERRED' as EnrollmentStatus } : e,
      ),
    )
  }

  function handleWithdraw() {
    if (!withdrawTarget) return
    startWithdraw(async () => {
      try {
        const updated = await withdrawEnrollment(withdrawTarget.id)
        setEnrollments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
        toast.success(`${withdrawTarget.studentName} retirado`)
        setWithdrawTarget(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al retirar')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-line bg-white shadow-card">
      <div className="px-5 py-4 border-b border-line">
        <h3 className="text-sm font-medium text-ink">Matriculados</h3>
      </div>
      {!enrollments.length ? (
        <div className="p-10 text-center">
          <p className="text-sm text-ghost">No hay alumnos matriculados en esta sección.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-surface">
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs text-prose">{e.studentCode}</TableCell>
                <TableCell className="text-sm font-medium text-ink">{e.studentName}</TableCell>
                <TableCell className="text-sm text-prose">{fmtDate(e.enrolledAt)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[e.status]}`}>
                    {STATUS_LABEL[e.status]}
                  </span>
                </TableCell>
                <TableCell>
                  {e.status === 'ACTIVE' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTransferTarget(e)}
                        className="p-1.5 rounded-lg text-ghost hover:text-amber-600 hover:bg-amber-50 transition-colors duration-150"
                        title="Trasladar"
                      >
                        <ArrowRightLeft size={14} />
                      </button>
                      <button
                        onClick={() => setWithdrawTarget(e)}
                        className="p-1.5 rounded-lg text-ghost hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
                        title="Retirar"
                      >
                        <UserMinus size={14} />
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TransferEnrollmentDialog
        enrollment={transferTarget}
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        onTransferred={handleTransferred}
      />

      <ConfirmDialog
        open={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={handleWithdraw}
        title="¿Retirar alumno?"
        description={`${withdrawTarget?.studentName} será marcado como retirado de esta sección.`}
        confirmLabel="Retirar"
        danger
        loading={isWithdrawing}
      />
    </div>
  )
}
