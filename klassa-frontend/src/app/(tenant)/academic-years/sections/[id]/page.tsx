import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSectionById } from '@/features/sections/api'
import { getEnrollmentsBySection } from '@/features/enrollments/api'
import { getSubjects } from '@/features/subjects/api'
import { getStudentPage } from '@/features/students/api'
import SectionEnrollments from '@/features/enrollments/components/SectionEnrollments'
import EnrollStudentDialog from '@/features/enrollments/components/EnrollStudentDialog'
import SectionScores from '@/features/scores/components/SectionScores'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SectionDetailPage({ params }: Props) {
  const { id } = await params
  const sectionId = Number(id)

  if (isNaN(sectionId)) notFound()

  const [section, enrollments, subjects, studentsPage] = await Promise.all([
    getSectionById(sectionId).catch(() => null),
    getEnrollmentsBySection(sectionId).catch(() => []),
    getSubjects().catch(() => []),
    getStudentPage({ size: 300, status: 'ACTIVE' }).catch(() => ({ content: [] })),
  ])

  if (!section) notFound()

  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE')
  const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId))
  const availableStudents = studentsPage.content.filter((s) => !enrolledStudentIds.has(s.id))

  return (
    <div className="flex flex-col gap-5 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/academic-years"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-line bg-white text-prose hover:text-ink hover:border-ink/20 transition-all duration-200"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-medium text-ink">Sección {section.name}</h1>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-prose">
            <span>{section.gradeLevelName}</span>
            <span className="text-ghost">·</span>
            <span>{section.academicYearName}</span>
            <span className="text-ghost">·</span>
            <span>
              <span className={section.activeEnrollments >= section.maxCapacity ? 'text-warning font-medium' : ''}>
                {section.activeEnrollments}
              </span>
              /{section.maxCapacity} alumnos
            </span>
            {section.homeroomTeacherName && (
              <>
                <span className="text-ghost">·</span>
                <span>Prof. {section.homeroomTeacherName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enrollments */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-prose">Matriculados ({activeEnrollments.length})</h2>
        <EnrollStudentDialog sectionId={sectionId} students={availableStudents} />
      </div>
      <SectionEnrollments initialEnrollments={enrollments} />

      {/* Scores — selector per student */}
      {activeEnrollments.length > 0 && (
        <SectionScores enrollments={activeEnrollments} subjects={subjects} />
      )}
    </div>
  )
}
