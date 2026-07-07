import { getAcademicYears } from '@/features/academic-years/api'
import { getSectionsByYear } from '@/features/sections/api'
import AttendanceClient from '@/features/attendance/components/AttendanceClient'

export default async function AttendancePage() {
  const years = await getAcademicYears().catch(() => [])
  const activeYear = years.find((y) => y.active)
  const sections = activeYear
    ? await getSectionsByYear(activeYear.id).catch(() => [])
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

      {!activeYear ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-ghost">No hay un año académico activo.</p>
        </div>
      ) : (
        <AttendanceClient sections={sections} defaultDate={today} />
      )}
    </div>
  )
}
