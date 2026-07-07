import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getStudentById, getFamilyById, getStudentEnrollments } from '@/features/students/api'
import StudentDetailHeader from '@/features/students/components/StudentDetailHeader'
import StudentInfoCard from '@/features/students/components/StudentInfoCard'
import FamilyInfoCard from '@/features/students/components/FamilyInfoCard'
import StudentEnrollments from '@/features/students/components/StudentEnrollments'
import EnrollmentAttendanceSummary from '@/features/attendance/components/EnrollmentAttendanceSummary'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params
  const studentId = Number(id)

  if (isNaN(studentId)) notFound()

  const [student, enrollments] = await Promise.all([
    getStudentById(studentId).catch(() => null),
    getStudentEnrollments(studentId).catch(() => []),
  ])

  if (!student) notFound()

  const family = student.familyId
    ? await getFamilyById(student.familyId).catch(() => null)
    : null

  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE')

  return (
    <div className="flex flex-col gap-5 px-4 md:px-8 max-w-7xl mx-auto">
      <StudentDetailHeader student={student} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StudentInfoCard student={student} />
        <FamilyInfoCard family={family} />
      </div>

      <StudentEnrollments enrollments={enrollments} />

      {activeEnrollments.length > 0 && (
        <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="text-sm font-medium text-ink">Asistencia — mes actual</h3>
          </div>
          <div className="divide-y divide-line">
            {activeEnrollments.map((e) => (
              <div key={e.id} className="px-5 py-4">
                <Suspense fallback={<p className="text-xs text-ghost">Cargando...</p>}>
                  <EnrollmentAttendanceSummary
                    enrollmentId={e.id}
                    sectionName={e.sectionName}
                  />
                </Suspense>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
