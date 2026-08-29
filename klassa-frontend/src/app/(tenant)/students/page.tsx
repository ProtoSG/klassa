import { Suspense } from 'react'
import { getStudentPage } from '@/features/students/api'
import StudentTable from '@/features/students/components/StudentTable'
import StudentsFilters from '@/features/students/components/StudentsFilters'
import NewStudentDialog from '@/features/students/components/NewStudentDialog'
import ImportStudentsDialog from '@/features/students/components/ImportStudentsDialog'
import Pagination from '@/shared/components/Pagination'
import { getMe } from '@/features/auth/actions'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'

const PAGE_SIZE = 20

interface SearchParams {
  page?: string
  status?: string
  search?: string
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(0, parseInt(sp.page ?? '0', 10) || 0)
  const status = sp.status ?? ''
  const search = sp.search ?? ''

  const session = await getMe()
  const canManage = session?.user.role !== 'TEACHER'
  const isAdmin = session?.user.role === 'ADMIN'

  const data = await getStudentPage({
    page,
    size: PAGE_SIZE,
    status: status || undefined,
    search: search || undefined,
  }).catch((err) => { logFetchError('students', err); return null })

  return (
    <div className="flex flex-col gap-5 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-ink">Alumnos</h1>
          <p className="text-prose text-sm mt-0.5">
            {data ? `${data.totalElements} alumno${data.totalElements !== 1 ? 's' : ''} en total` : 'Gestión de estudiantes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <ImportStudentsDialog />}
          {canManage && <NewStudentDialog />}
        </div>
      </div>

      {/* Filters — client */}
      <Suspense>
        <StudentsFilters canManage={canManage} />
      </Suspense>

      {/* Table */}
      {data ? (
        <>
          <StudentTable students={data.content} />
          <Suspense>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              size={data.size}
            />
          </Suspense>
        </>
      ) : (
        <ErrorState message="Error al cargar los alumnos." />
      )}
    </div>
  )
}
