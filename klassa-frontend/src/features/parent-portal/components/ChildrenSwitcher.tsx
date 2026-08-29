'use client'

import { useSelectedChild } from '@/shared/store/selected-child'
import { useEffectiveChildId } from '@/features/parent-portal/hooks/useEffectiveChildId'
import type { ChildSummary } from './ChildSummaryCard'

/**
 * Doubles as the "compare all kids at a glance" view when there's more than
 * one child — each card already carries the same stats `ChildSummaryCard`
 * shows for the selected child, so a parent with 2-3 kids doesn't have to
 * tap into each one just to see who needs attention.
 */
export default function ChildrenSwitcher({ data }: { data: ChildSummary[] }) {
  const selectChild = useSelectedChild((s) => s.selectChild)
  const effectiveChildId = useEffectiveChildId(data.map((d) => d.student.id))

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <p className="text-sm text-prose">No hay alumnos registrados en tu familia.</p>
      </div>
    )
  }

  const multiple = data.length > 1

  return (
    <div className={multiple ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
      {data.map(({ student, sectionName, enrollment, percentage, latestPeriodAvg, balance }) => {
        const selected = !multiple || student.id === effectiveChildId
        const hasBalance = balance !== null && parseFloat(balance) > 0
        return (
          <button
            key={student.id}
            type="button"
            onClick={() => selectChild(student.id)}
            className={`flex flex-col gap-3 rounded-2xl border p-4 text-left shadow-card transition-all duration-200 ${
              multiple && selected
                ? 'border-accent bg-accent/10'
                : 'border-line bg-white hover:-translate-y-0.5 hover:shadow-hover'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted-fill flex items-center justify-center overflow-hidden shrink-0">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-ink/70">
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{student.fullName}</p>
                <p className="text-xs text-ghost mt-0.5">{sectionName ?? 'Sin sección asignada'}</p>
              </div>
              {multiple && selected && (
                <span className="ml-auto shrink-0 text-[10px] font-medium text-ink/60 bg-accent/40 rounded-full px-2 py-1">
                  Viendo
                </span>
              )}
            </div>

            {multiple && enrollment && (
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-line/70">
                <div className="text-center pt-2">
                  <p className="text-sm font-medium text-ink">{percentage ? `${percentage.percentage}%` : '—'}</p>
                  <p className="text-[9px] text-ghost">Asistencia</p>
                </div>
                <div className="text-center pt-2">
                  <p className="text-sm font-medium text-ink">{latestPeriodAvg !== null ? latestPeriodAvg.toFixed(1) : '—'}</p>
                  <p className="text-[9px] text-ghost">Promedio</p>
                </div>
                <div className="text-center pt-2">
                  <p className={`text-sm font-medium ${hasBalance ? 'text-danger' : 'text-ink'}`}>
                    {balance !== null ? `S/${balance}` : '—'}
                  </p>
                  <p className="text-[9px] text-ghost">Saldo</p>
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
