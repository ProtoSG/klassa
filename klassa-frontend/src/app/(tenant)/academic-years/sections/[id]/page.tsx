import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSectionById } from '@/features/sections/api'
import { getEnrollmentsBySection } from '@/features/enrollments/api'
import { getSubjects } from '@/features/subjects/api'
import { getStudentPage } from '@/features/students/api'
import { getUsers } from '@/features/users/api'
import { getTeachingAssignmentsBySection } from '@/features/teaching-assignments/api'
import { getMe } from '@/features/auth/actions'
import SectionEnrollments from '@/features/enrollments/components/SectionEnrollments'
import EnrollStudentDialog from '@/features/enrollments/components/EnrollStudentDialog'
import SectionScores from '@/features/scores/components/SectionScores'
import SectionCourses from '@/features/teaching-assignments/components/SectionCourses'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SectionDetailPage({ params }: Props) {
  const { id } = await params
  const sectionId = Number(id)

  if (isNaN(sectionId)) notFound()

  const section = await getSectionById(sectionId).catch(() => null)
  if (!section) notFound()

  const session = await getMe()
  const canManage = session?.user.role !== 'TEACHER'

  const [enrollments, gradeSubjects, studentsPage, teachers, teachingAssignments] = await Promise.all([
    getEnrollmentsBySection(sectionId).catch(() => []),
    getSubjects(section.gradeLevelId).catch(() => []),
    getStudentPage({ size: 300, status: 'ACTIVE' }).catch(() => ({ content: [] })),
    getUsers('TEACHER').catch(() => []),
    getTeachingAssignmentsBySection(sectionId).catch(() => []),
  ])

  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE')
  const activeStudentIds = new Set(activeEnrollments.map((e) => e.studentId))
  const availableStudents = studentsPage.content.filter((s) => !activeStudentIds.has(s.id))
  const assignedSubjectIds = new Set(teachingAssignments.map((a) => a.subjectId))
  const gradableSubjects = gradeSubjects.filter((s) => assignedSubjectIds.has(s.id))

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

      {/* Teaching assignments */}
      <SectionCourses
        sectionId={sectionId}
        initialAssignments={teachingAssignments}
        subjects={gradeSubjects}
        teachers={teachers}
        canManage={canManage}
      />

      {/* Enrollments */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-prose">Matriculados ({activeEnrollments.length})</h2>
        {canManage && <EnrollStudentDialog sectionId={sectionId} students={availableStudents} />}
      </div>
      <SectionEnrollments initialEnrollments={enrollments} canManage={canManage} />

      {/* Scores — selector per student */}
      {activeEnrollments.length > 0 && (
        <SectionScores enrollments={activeEnrollments} subjects={gradableSubjects} />
      )}
    </div>
  )
}
