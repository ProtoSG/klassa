import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { StudentResponse, StudentStatus } from '../types'
import EditStudentDialog from './EditStudentDialog'
import StatusChangeButton from './StatusChangeButton'
import StudentPhotoButton from './StudentPhotoButton'

const STATUS_STYLE: Record<StudentStatus, string> = {
  ACTIVE: 'bg-accent/40 text-ink/80',
  INACTIVE: 'bg-muted-fill text-prose',
  TRANSFERRED: 'bg-amber-100 text-amber-700',
}

const STATUS_LABEL: Record<StudentStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  TRANSFERRED: 'Trasladado',
}

interface Props {
  student: StudentResponse
}

export default function StudentDetailHeader({ student }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/students"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-line bg-white text-prose hover:text-ink hover:border-ink/20 transition-all duration-200"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex items-center gap-3">
          <StudentPhotoButton
            studentId={student.id}
            fullName={student.fullName}
            firstName={student.firstName}
            lastName={student.lastName}
            photoUrl={student.photoUrl}
          />
          <div>
            <h1 className="text-xl font-medium text-ink">{student.fullName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-ghost">{student.code}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[student.status]}`}>
                {STATUS_LABEL[student.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusChangeButton studentId={student.id} currentStatus={student.status} />
        <EditStudentDialog student={student} />
      </div>
    </div>
  )
}
