import type { AcademicYearResponse } from '@/features/academic-years/types'

interface Props {
  totalStudents: number
  activeStudents: number
  activeYear: AcademicYearResponse | null
}

export default function TenantDashboardStats({ totalStudents, activeStudents, activeYear }: Props) {
  const inactive = totalStudents - activeStudents

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-2xl bg-white border border-line p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-300">
        <p className="text-xs font-medium text-ghost">Total estudiantes</p>
        <p className="mt-2 text-3xl font-medium text-ink">{totalStudents}</p>
      </div>

      <div className="rounded-2xl bg-white border border-line p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-300">
        <p className="text-xs font-medium text-ghost">Activos</p>
        <p className="mt-2 text-3xl font-medium text-ink">{activeStudents}</p>
        <div className="mt-2 inline-flex items-center gap-1 bg-accent/30 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-xs text-ink/70">activos</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-line p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-300">
        <p className="text-xs font-medium text-ghost">Inactivos</p>
        <p className="mt-2 text-3xl font-medium text-prose">{inactive}</p>
      </div>

      <div className="rounded-2xl bg-ink text-white p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-300">
        <p className="text-xs font-medium text-white/50">Año académico</p>
        <p className="mt-2 text-lg font-medium leading-tight truncate">
          {activeYear?.name ?? '—'}
        </p>
        <p className="text-xs text-white/40 mt-1 truncate">
          {activeYear
            ? `${fmt(activeYear.startDate)} – ${fmt(activeYear.endDate)}`
            : 'Sin año activo'}
        </p>
      </div>
    </div>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es', { month: 'short', year: 'numeric' })
}
