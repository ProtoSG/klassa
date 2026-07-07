import { getAcademicYears } from '@/features/academic-years/api'
import { getGradeLevelsGrouped } from '@/features/grade-levels/api'
import { getSubjects } from '@/features/subjects/api'
import { getSectionsByYear } from '@/features/sections/api'
import AcademicPageClient from '@/features/academic-years/components/AcademicPageClient'

export default async function AcademicYearsPage() {
  const [years, grouped, subjects] = await Promise.all([
    getAcademicYears().catch(() => []),
    getGradeLevelsGrouped().catch(() => ({} as Record<string, []>)),
    getSubjects().catch(() => []),
  ])

  const activeYear = years.find((y) => y.active) ?? years[0]
  const sections = activeYear
    ? await getSectionsByYear(activeYear.id).catch(() => [])
    : []

  return (
    <AcademicPageClient
      years={years}
      grouped={grouped as Record<string, []>}
      subjects={subjects}
      sections={sections}
      activeYearId={activeYear?.id ?? null}
    />
  )
}
