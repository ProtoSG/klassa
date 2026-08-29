import { getMyChildrenWithEnrollment } from '@/features/parent-portal/api'
import { getAttendanceByEnrollment, getAttendancePercentage } from '@/features/attendance/api'
import AsistenciaClient from '@/features/parent-portal/components/AsistenciaClient'
import FamilyNotLinkedState from '@/features/parent-portal/components/FamilyNotLinkedState'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'
import { ApiError } from '@/shared/lib/tenant-fetch'

export default async function AsistenciaPage() {
  let childrenWithEnrollment
  try {
    childrenWithEnrollment = await getMyChildrenWithEnrollment()
  } catch (err) {
    if (err instanceof ApiError && err.code === 'FAMILY_NOT_LINKED') {
      return <FamilyNotLinkedState />
    }
    logFetchError('parent-portal-asistencia', err)
    return (
      <div className="px-4 max-w-md md:max-w-2xl mx-auto pt-10">
        <ErrorState message="Error al cargar la asistencia." />
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const data = await Promise.all(
    childrenWithEnrollment.map(async ({ student, enrollment }) => {
      if (!enrollment) return { student, enrollment, records: [], percentage: null }
      const start = enrollment.enrolledAt.split('T')[0]
      const [records, percentage] = await Promise.all([
        getAttendanceByEnrollment(enrollment.id)
          .catch((err) => { logFetchError(`parent-portal-attendance-${enrollment.id}`, err); return [] }),
        getAttendancePercentage(enrollment.id, start, today)
          .catch((err) => { logFetchError(`parent-portal-attendance-pct-${enrollment.id}`, err); return null }),
      ])
      return { student, enrollment, records, percentage }
    }),
  )

  return (
    <div className="px-4 max-w-md md:max-w-2xl mx-auto flex flex-col gap-4 pt-6">
      <div>
        <h1 className="text-xl font-medium text-ink">Asistencia</h1>
      </div>
      <AsistenciaClient data={data} />
    </div>
  )
}
