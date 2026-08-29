import { getMyChildren } from '@/features/parent-portal/api'
import { getInvoicesByStudent, getStudentBalance } from '@/features/billing/api'
import PagosClient from '@/features/parent-portal/components/PagosClient'
import FamilyNotLinkedState from '@/features/parent-portal/components/FamilyNotLinkedState'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'
import { ApiError } from '@/shared/lib/tenant-fetch'

const INVOICES_PAGE_SIZE = 50

export default async function PagosPage() {
  let children
  try {
    children = await getMyChildren()
  } catch (err) {
    if (err instanceof ApiError && err.code === 'FAMILY_NOT_LINKED') {
      return <FamilyNotLinkedState />
    }
    logFetchError('parent-portal-pagos', err)
    return (
      <div className="px-4 max-w-md md:max-w-2xl mx-auto pt-10">
        <ErrorState message="Error al cargar los cobros." />
      </div>
    )
  }

  const data = await Promise.all(
    children.map(async (student) => {
      const [invoicesPage, balance] = await Promise.all([
        getInvoicesByStudent(student.id, 0, INVOICES_PAGE_SIZE)
          .catch((err) => { logFetchError(`parent-portal-invoices-${student.id}`, err); return null }),
        getStudentBalance(student.id)
          .catch((err) => { logFetchError(`parent-portal-balance-${student.id}`, err); return null }),
      ])
      return { student, invoices: invoicesPage?.content ?? [], balance }
    }),
  )

  return (
    <div className="px-4 max-w-md md:max-w-2xl mx-auto flex flex-col gap-4 pt-6">
      <div>
        <h1 className="text-xl font-medium text-ink">Cobros</h1>
      </div>
      <PagosClient data={data} />
    </div>
  )
}
