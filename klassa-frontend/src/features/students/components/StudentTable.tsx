import Link from 'next/link'
import type { StudentResponse, StudentStatus } from '../types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

const GENDER_LABEL: Record<string, string> = {
  M: 'Masculino',
  F: 'Femenino',
  O: 'Otro',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface Props {
  students: StudentResponse[]
}

export default function StudentTable({ students }: Props) {
  if (!students.length) {
    return (
      <div className="rounded-2xl border border-line bg-white p-16 text-center shadow-card">
        <p className="text-prose text-sm">No se encontraron alumnos.</p>
        <p className="text-ghost text-xs mt-1">Intenta con otros filtros o busca otro nombre.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-surface">
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Género</TableHead>
            <TableHead>Nacimiento</TableHead>
            <TableHead>Acudiente</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.id} className="group">
              <TableCell className="font-mono text-xs text-prose">{s.code}</TableCell>
              <TableCell>
                <Link href={`/students/${s.id}`} className="flex items-center gap-2.5 group/link">
                  <div className="w-8 h-8 rounded-full bg-muted-fill flex items-center justify-center shrink-0 text-xs font-medium text-prose group-hover/link:bg-accent/30 transition-colors duration-200">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.fullName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span>{s.firstName[0]}{s.lastName[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink group-hover/link:text-accent transition-colors duration-200">{s.fullName}</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-prose text-sm">{GENDER_LABEL[s.gender] ?? '—'}</TableCell>
              <TableCell className="text-prose text-xs whitespace-nowrap">{fmt(s.birthDate)}</TableCell>
              <TableCell className="text-prose text-sm">{s.guardianName}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
