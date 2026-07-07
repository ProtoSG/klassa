import { Suspense } from 'react'
import { getStudentPage } from '@/features/students/api'
import StudentTable from '@/features/students/components/StudentTable'
import StudentsFilters from '@/features/students/components/StudentsFilters'
import NewStudentDialog from '@/features/students/components/NewStudentDialog'
import Pagination from '@/shared/components/Pagination'

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

  const data = await getStudentPage({
    page,
    size: PAGE_SIZE,
    status: status || undefined,
    search: search || undefined,
  }).catch(() => null)

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
        <NewStudentDialog />
      </div>

      {/* Filters — client */}
      <Suspense>
        <StudentsFilters />
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
        <div className="rounded-2xl border border-line bg-white p-16 text-center shadow-card">
          <p className="text-prose text-sm">Error al cargar los alumnos.</p>
          <p className="text-ghost text-xs mt-1">Verifica tu conexión o intenta de nuevo.</p>
        </div>
      )}
    </div>
  )
}
