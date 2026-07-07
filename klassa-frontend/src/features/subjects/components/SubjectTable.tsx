import type { Subject } from '../types'
import type { GradeLevel } from '@/features/grade-levels/types'
import NewSubjectDialog from './NewSubjectDialog'

interface Props {
  subjects: Subject[]
  gradeLevels: GradeLevel[]
}

export default function SubjectTable({ subjects, gradeLevels }: Props) {
  const gradeLevelMap = new Map(gradeLevels.map((gl) => [gl.id, gl.name]))

  return (
    <div className="rounded-2xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <h3 className="text-sm font-medium text-ink">Materias</h3>
        <NewSubjectDialog gradeLevels={gradeLevels} />
      </div>
      {!subjects.length ? (
        <div className="p-10 text-center">
          <p className="text-sm text-ghost">No hay materias registradas.</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Nombre</th>
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Grado</th>
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Hrs/sem</th>
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-ink">{s.name}</td>
                <td className="px-5 py-3 text-sm text-prose">{gradeLevelMap.get(s.gradeLevelId) ?? '—'}</td>
                <td className="px-5 py-3 text-sm text-prose">{s.hoursPerWeek}</td>
                <td className="px-5 py-3">
                  {s.active ? (
                    <span className="inline-flex items-center bg-accent/30 text-ink/80 px-2.5 py-0.5 rounded-full text-xs font-medium">Activa</span>
                  ) : (
                    <span className="inline-flex items-center bg-muted-fill text-prose px-2.5 py-0.5 rounded-full text-xs font-medium">Inactiva</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
