import { getAttendancePercentage, getRecentAttendance } from '../api'
import type { AttendanceStatus } from '../types'

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Tarde',
  JUSTIFIED: 'Justificado',
}

const STATUS_CLASS: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-700 border-red-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  JUSTIFIED: 'bg-blue-50 text-blue-700 border-blue-200',
}

interface Props {
  enrollmentId: number
  sectionName: string
}

export default async function EnrollmentAttendanceSummary({ enrollmentId, sectionName }: Props) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end = now.toISOString().split('T')[0]

  const [percentage, records] = await Promise.all([
    getAttendancePercentage(enrollmentId, start, end).catch(() => null),
    getRecentAttendance(enrollmentId, start, end).catch(() => []),
  ])

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-prose">{sectionName}</p>
        {percentage && (
          <div className="flex items-center gap-3 text-xs text-ghost">
            <span>{percentage.attendedDays}/{percentage.totalDays} días</span>
            <span className={`font-semibold text-sm ${parseFloat(percentage.percentage) >= 85 ? 'text-emerald-600' : parseFloat(percentage.percentage) >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
              {percentage.percentage}%
            </span>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-ghost">Sin registros este mes.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sorted.map((r) => (
            <div key={r.id} className="flex items-center justify-between">
              <span className="text-xs text-prose">{r.date}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-xs font-medium ${STATUS_CLASS[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
