import { getAcademicYears } from '@/features/academic-years/api'
import { getSectionsByYear } from '@/features/sections/api'
import AttendanceClient from '@/features/attendance/components/AttendanceClient'
import { getMe } from '@/features/auth/actions'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'

export default async function AttendancePage() {
  const session = await getMe()
  const isTeacher = session?.user.role === 'TEACHER'

  const years = await getAcademicYears().catch((err) => { logFetchError('attendance-years', err); return null })
  const activeYear = years?.find((y) => y.active)
  const sections = activeYear
    ? await getSectionsByYear(activeYear.id, { mine: isTeacher }).catch(() => [])
    : []

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-medium text-ink">Asistencia</h1>
        <p className="text-prose mt-1 text-sm">
          {activeYear ? activeYear.name : 'Control de asistencia'}
        </p>
      </div>

      {years === null ? (
        <ErrorState message="Error al cargar la asistencia." />
      ) : !activeYear ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-ghost">No hay un año académico activo.</p>
        </div>
      ) : (
        <AttendanceClient sections={sections} defaultDate={today} />
      )}
    </div>
  )
}
