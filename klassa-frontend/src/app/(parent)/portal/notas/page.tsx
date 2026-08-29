import { getMyChildrenWithEnrollment } from '@/features/parent-portal/api'
import { getScoresByEnrollment } from '@/features/scores/api'
import NotasClient from '@/features/parent-portal/components/NotasClient'
import FamilyNotLinkedState from '@/features/parent-portal/components/FamilyNotLinkedState'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'
import { ApiError } from '@/shared/lib/tenant-fetch'

export default async function NotasPage() {
  let childrenWithEnrollment
  try {
    childrenWithEnrollment = await getMyChildrenWithEnrollment()
  } catch (err) {
    if (err instanceof ApiError && err.code === 'FAMILY_NOT_LINKED') {
      return <FamilyNotLinkedState />
    }
    logFetchError('parent-portal-notas', err)
    return (
      <div className="px-4 max-w-md md:max-w-2xl mx-auto pt-10">
        <ErrorState message="Error al cargar las notas." />
      </div>
    )
  }

  const data = await Promise.all(
    childrenWithEnrollment.map(async ({ student, enrollment }) => ({
      student,
      enrollment,
      scores: enrollment
        ? await getScoresByEnrollment(enrollment.id)
            .catch((err) => { logFetchError(`parent-portal-scores-${enrollment.id}`, err); return [] })
        : [],
    })),
  )

  return (
    <div className="px-4 max-w-md md:max-w-2xl mx-auto flex flex-col gap-4 pt-6">
      <div>
        <h1 className="text-xl font-medium text-ink">Notas</h1>
      </div>
      <NotasClient data={data} />
    </div>
  )
}
