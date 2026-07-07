import type { ScoreResponse } from '../types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  scores: ScoreResponse[]
}

export default function ScoreTable({ scores }: Props) {
  if (!scores.length) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
        <p className="text-sm text-ghost">No hay notas registradas.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-surface">
            <TableHead>Materia</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Nota</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scores.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="text-sm font-medium text-ink">{s.subjectName}</TableCell>
              <TableCell className="text-sm text-prose">{s.period}° período</TableCell>
              <TableCell className="text-sm text-ink font-medium">{s.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
