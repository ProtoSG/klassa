import { getAcademicYears } from '@/features/academic-years/api'
import { getFeeSchedules } from '@/features/billing/api'
import { getStudentPage } from '@/features/students/api'
import BillingPageClient from '@/features/billing/components/BillingPageClient'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'

export default async function BillingPage() {
  const years = await getAcademicYears().catch((err) => { logFetchError('billing-years', err); return null })
  const activeYear = years?.find((y) => y.active)

  const [feeSchedules, studentsPage] = await Promise.all([
    activeYear
      ? getFeeSchedules(activeYear.id).catch((err) => { logFetchError('billing-fee-schedules', err); return null })
      : Promise.resolve([]),
    getStudentPage({ size: 300, status: 'ACTIVE' }).catch((err) => { logFetchError('billing-students', err); return null }),
  ])

  const hasError = years === null || feeSchedules === null || studentsPage === null

  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-medium text-ink">Facturación</h1>
        <p className="text-prose mt-1 text-sm">
          {activeYear ? activeYear.name : 'Gestión de cobros y pagos'}
        </p>
      </div>

      {hasError ? (
        <ErrorState message="Error al cargar la facturación." />
      ) : !activeYear ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-ghost">No hay un año académico activo.</p>
        </div>
      ) : (
        <BillingPageClient
          feeSchedules={feeSchedules}
          students={studentsPage.content}
          activeYearId={activeYear.id}
        />
      )}
    </div>
  )
}
