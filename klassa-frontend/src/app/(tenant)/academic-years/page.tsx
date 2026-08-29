import { getAcademicYears } from '@/features/academic-years/api'
import { getGradeLevelsGrouped } from '@/features/grade-levels/api'
import { getSubjects } from '@/features/subjects/api'
import { getSectionsByYear } from '@/features/sections/api'
import { getUsers } from '@/features/users/api'
import AcademicPageClient from '@/features/academic-years/components/AcademicPageClient'
import { getMe } from '@/features/auth/actions'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'

export default async function AcademicYearsPage() {
  const session = await getMe()
  const isTeacher = session?.user.role === 'TEACHER'

  const [years, grouped, subjects, teachers] = await Promise.all([
    getAcademicYears().catch((err) => { logFetchError('academic-years', err); return null }),
    getGradeLevelsGrouped().catch(() => ({} as Record<string, []>)),
    getSubjects().catch(() => []),
    getUsers('TEACHER').catch(() => []),
  ])

  if (!years) {
    return (
      <div className="px-4 md:px-8 max-w-7xl mx-auto">
        <ErrorState message="Error al cargar los años académicos." />
      </div>
    )
  }

  const activeYear = years.find((y) => y.active) ?? years[0]
  const sections = activeYear
    ? await getSectionsByYear(activeYear.id, { mine: isTeacher }).catch(() => [])
    : []

  return (
    <AcademicPageClient
      years={years}
      grouped={grouped as Record<string, []>}
      subjects={subjects}
      sections={sections}
      activeYearId={activeYear?.id ?? null}
      isTeacher={isTeacher}
      teachers={teachers}
    />
  )
}
