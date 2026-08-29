'use client'

import { useEffectiveChildId } from '../hooks/useEffectiveChildId'
import ChildPickerBar from './ChildPickerBar'
import type { StudentResponse, EnrollmentResponse } from '@/features/students/types'
import type { AttendanceResponse, AttendancePercentageResponse } from '@/features/attendance/types'

export interface ChildAttendance {
  student: StudentResponse
  enrollment: EnrollmentResponse | null
  records: AttendanceResponse[]
  percentage: AttendancePercentageResponse | null
}

const STATUS_LABEL: Record<AttendanceResponse['status'], string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Tarde',
  JUSTIFIED: 'Justificado',
}

const STATUS_CLASS: Record<AttendanceResponse['status'], string> = {
  PRESENT: 'bg-accent/30 text-ink border-accent/50',
  ABSENT: 'bg-danger/10 text-danger border-danger/30',
  LATE: 'bg-warning/10 text-warning border-warning/30',
  JUSTIFIED: 'bg-blue-50 text-blue-700 border-blue-200',
}

export default function AsistenciaClient({ data }: { data: ChildAttendance[] }) {
  const effectiveId = useEffectiveChildId(data.map((d) => d.student.id))
  const current = data.find((d) => d.student.id === effectiveId)

  if (!current) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <p className="text-sm text-prose">No hay alumnos registrados en tu familia.</p>
      </div>
    )
  }

  const sorted = [...current.records].sort((a, b) => b.date.localeCompare(a.date))
  const pct = current.percentage ? parseFloat(current.percentage.percentage) : null

  return (
    <div className="flex flex-col gap-3">
      <ChildPickerBar data={data} currentId={current.student.id} />

      {!current.enrollment ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="text-sm text-prose">{current.student.fullName} no tiene una matrícula activa.</p>
        </div>
      ) : (
        <>
          {current.percentage && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs text-ghost">Asistencia desde la matrícula</p>
                <p className="text-xs text-prose mt-0.5">
                  {current.percentage.attendedDays}/{current.percentage.totalDays} días
                </p>
              </div>
              <span
                className={`text-2xl font-medium ${
                  pct !== null && pct >= 85 ? 'text-ink' : pct !== null && pct >= 70 ? 'text-warning' : 'text-danger'
                }`}
              >
                {current.percentage.percentage}%
              </span>
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
              <p className="text-sm text-prose">Todavía no hay registros de asistencia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sorted.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card"
                >
                  <div>
                    <p className="text-sm text-ink">{r.date}</p>
                    {r.note && <p className="text-xs text-ghost mt-0.5">{r.note}</p>}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-xs font-medium ${STATUS_CLASS[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
