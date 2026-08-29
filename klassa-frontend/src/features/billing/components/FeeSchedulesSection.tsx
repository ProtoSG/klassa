'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import NewFeeScheduleDialog from './NewFeeScheduleDialog'
import GenerateMonthlyDialog from './GenerateMonthlyDialog'
import { deleteFeeSchedule } from '../actions'
import type { FeeScheduleResponse } from '../types'

interface Props {
  initialSchedules: FeeScheduleResponse[]
  academicYearId: number
}

export default function FeeSchedulesSection({ initialSchedules, academicYearId }: Props) {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [deleteTarget, setDeleteTarget] = useState<FeeScheduleResponse | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreated(s: FeeScheduleResponse) {
    setSchedules((prev) => [...prev, s])
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteFeeSchedule(deleteTarget.id)
        setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id))
        toast.success('Arancel eliminado')
        setDeleteTarget(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ghost">{schedules.length} arancel{schedules.length !== 1 ? 'es' : ''}</p>
        <div className="flex items-center gap-2">
          <GenerateMonthlyDialog
            academicYearId={academicYearId}
            feeSchedules={schedules}
            onGenerated={() => toast.success('Proceso iniciado')}
          />
          <NewFeeScheduleDialog academicYearId={academicYearId} onCreated={handleCreated} />
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-ghost">No hay aranceles configurados.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-surface">
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Día venc.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm font-medium text-ink">{s.concept}</TableCell>
                  <TableCell className="text-sm text-ink">S/ {s.amount}</TableCell>
                  <TableCell className="text-sm text-prose">Día {s.dueDay}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-xs font-medium ${s.active ? 'bg-accent/30 text-ink border-accent/50' : 'bg-muted-fill text-ghost border-line'}`}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="p-1.5 rounded-lg text-ghost hover:text-danger hover:bg-danger/10 transition-colors duration-150"
                    >
                      <Trash2 size={14} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar arancel?"
        description={`Se eliminará "${deleteTarget?.concept}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={isPending}
      />
    </div>
  )
}
