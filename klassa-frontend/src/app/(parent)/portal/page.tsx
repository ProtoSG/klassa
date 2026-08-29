import { getMyChildrenWithEnrollment } from '@/features/parent-portal/api'
import { getAttendancePercentage } from '@/features/attendance/api'
import { getScoresByEnrollment } from '@/features/scores/api'
import { getStudentBalance } from '@/features/billing/api'
import ChildrenSwitcher from '@/features/parent-portal/components/ChildrenSwitcher'
import ChildSummaryCard from '@/features/parent-portal/components/ChildSummaryCard'
import FamilyNotLinkedState from '@/features/parent-portal/components/FamilyNotLinkedState'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'
import { ApiError } from '@/shared/lib/tenant-fetch'
import AccessDeniedToast from '@/features/parent-portal/components/AccessDeniedToast'

export default async function ParentPortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>
}) {
  const { denied } = await searchParams
  let childrenWithEnrollment
  try {
    childrenWithEnrollment = await getMyChildrenWithEnrollment()
  } catch (err) {
    if (err instanceof ApiError && err.code === 'FAMILY_NOT_LINKED') {
      return <FamilyNotLinkedState />
    }
    logFetchError('parent-portal-home', err)
    return (
      <div className="px-4 max-w-md md:max-w-2xl mx-auto pt-10">
        <ErrorState message="Error al cargar tus hijos." />
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const summaries = await Promise.all(
    childrenWithEnrollment.map(async ({ student, enrollment }) => {
      if (!enrollment) {
        return { student, enrollment, sectionName: null, percentage: null, latestPeriodAvg: null, balance: null }
      }
      const start = enrollment.enrolledAt.split('T')[0]
      const [percentage, scores, balance] = await Promise.all([
        getAttendancePercentage(enrollment.id, start, today)
          .catch((err) => { logFetchError(`parent-portal-home-attendance-${enrollment.id}`, err); return null }),
        getScoresByEnrollment(enrollment.id)
          .catch((err) => { logFetchError(`parent-portal-home-scores-${enrollment.id}`, err); return [] }),
        getStudentBalance(student.id)
          .catch((err) => { logFetchError(`parent-portal-home-balance-${student.id}`, err); return null }),
      ])

      const latestPeriod = scores.reduce<number | null>((max, s) => (max === null || s.period > max ? s.period : max), null)
      const latestPeriodScores = latestPeriod === null ? [] : scores.filter((s) => s.period === latestPeriod)
      const latestPeriodAvg = latestPeriodScores.length === 0
        ? null
        : latestPeriodScores.reduce((sum, s) => sum + parseFloat(s.score), 0) / latestPeriodScores.length

      return { student, enrollment, sectionName: enrollment.sectionName, percentage, latestPeriodAvg, balance }
    }),
  )

  return (
    <div className="px-4 max-w-md md:max-w-2xl mx-auto flex flex-col gap-4 pt-6">
      <AccessDeniedToast show={denied === '1'} />
      <div>
        <h1 className="text-xl font-medium text-ink">Mis hijos</h1>
        <p className="text-prose text-sm mt-0.5">
          {summaries.length > 1
            ? 'Selecciona un alumno para ver su información'
            : 'Información de tu hijo/a'}
        </p>
      </div>
      <ChildrenSwitcher data={summaries} />
      <ChildSummaryCard data={summaries} />
    </div>
  )
}
