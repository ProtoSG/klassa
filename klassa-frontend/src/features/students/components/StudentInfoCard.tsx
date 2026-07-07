import type { StudentResponse } from '../types'

const GENDER_LABEL: Record<string, string> = {
  M: 'Masculino',
  F: 'Femenino',
  O: 'Otro',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

interface Props {
  student: StudentResponse
}

export default function StudentInfoCard({ student }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-sm font-medium text-ink mb-4">Datos Personales</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-ghost">Nombre completo</p>
          <p className="text-sm text-ink mt-0.5">{student.fullName}</p>
        </div>
        <div>
          <p className="text-xs text-ghost">Código</p>
          <p className="text-sm text-ink mt-0.5 font-mono">{student.code}</p>
        </div>
        <div>
          <p className="text-xs text-ghost">Fecha de nacimiento</p>
          <p className="text-sm text-ink mt-0.5">{fmtDate(student.birthDate)}</p>
        </div>
        <div>
          <p className="text-xs text-ghost">Género</p>
          <p className="text-sm text-ink mt-0.5">{GENDER_LABEL[student.gender] ?? student.gender}</p>
        </div>
      </div>
    </div>
  )
}
