import Link from 'next/link'
import type { StudentResponse } from '../types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusLabel: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  TRANSFERRED: 'Trasladado',
}

const statusStyle: Record<string, string> = {
  ACTIVE: 'bg-accent/30 text-ink/80',
  INACTIVE: 'bg-muted-fill text-prose',
  TRANSFERRED: 'bg-amber-100 text-amber-700',
}

export default function RecentStudents({ students }: { students: StudentResponse[] }) {
  if (!students.length) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center text-prose text-sm shadow-card">
        No hay estudiantes registrados.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-surface">
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Acudiente</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium text-ink">{s.fullName}</TableCell>
              <TableCell className="font-mono text-xs text-prose">{s.code}</TableCell>
              <TableCell className="text-prose">{s.guardianName}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[s.status] ?? 'bg-muted-fill text-prose'}`}>
                  {statusLabel[s.status] ?? s.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
