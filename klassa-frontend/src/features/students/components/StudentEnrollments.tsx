'use client'

import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import TransferEnrollmentDialog from '@/features/enrollments/components/TransferEnrollmentDialog'
import type { EnrollmentResponse, EnrollmentStatus } from '../types'

const STATUS_STYLE: Record<EnrollmentStatus, string> = {
  ACTIVE: 'bg-accent/30 text-ink/80',
  WITHDRAWN: 'bg-muted-fill text-prose',
  TRANSFERRED: 'bg-warning/15 text-warning',
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
  enrollments: EnrollmentResponse[]
  canManage: boolean
}

export default function StudentEnrollments({ enrollments: initial, canManage }: Props) {
  const [enrollments, setEnrollments] = useState(initial)
  const [transferTarget, setTransferTarget] = useState<EnrollmentResponse | null>(null)

  function handleTransferred(oldEnrollmentId: number, newEnrollment: EnrollmentResponse) {
    setEnrollments((prev) => {
      const updated = prev.map((e) =>
        e.id === oldEnrollmentId ? { ...e, status: 'TRANSFERRED' as EnrollmentStatus } : e,
      )
      return [...updated, newEnrollment]
    })
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-sm font-medium text-ink mb-4">Matrículas</h2>
      {!enrollments.length ? (
        <p className="text-sm text-ghost">No hay matrículas registradas.</p>
      ) : (
        <div className="rounded-xl border border-line overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-surface">
                <TableHead>Sección</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm font-medium text-ink">{e.sectionName}</TableCell>
                  <TableCell className="text-sm text-prose">{fmtDate(e.enrolledAt)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[e.status]}`}>
                      {STATUS_LABEL[e.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {canManage && e.status === 'ACTIVE' && (
                      <button
                        onClick={() => setTransferTarget(e)}
                        className="p-1.5 rounded-lg text-ghost hover:text-warning hover:bg-warning/10 transition-colors duration-150"
                        title="Trasladar a otra sección"
                      >
                        <ArrowRightLeft size={14} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TransferEnrollmentDialog
        enrollment={transferTarget}
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        onTransferred={handleTransferred}
      />
    </div>
  )
}
