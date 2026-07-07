import Link from 'next/link'
import type { SectionResponse } from '../types'
import NewSectionDialog from './NewSectionDialog'
import type { GradeLevel } from '@/features/grade-levels/types'

interface Props {
  sections: SectionResponse[]
  academicYearId: number
  gradeLevels: GradeLevel[]
}

export default function SectionTable({ sections, academicYearId, gradeLevels }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <h3 className="text-sm font-medium text-ink">Secciones</h3>
        <NewSectionDialog academicYearId={academicYearId} gradeLevels={gradeLevels} />
      </div>
      {!sections.length ? (
        <div className="p-10 text-center">
          <p className="text-sm text-ghost">No hay secciones para este año académico.</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Sección</th>
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Grado</th>
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Capacidad</th>
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Profesor</th>
              <th className="text-left text-xs font-medium text-ghost px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => {
              const isFull = s.activeEnrollments >= s.maxCapacity
              return (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/academic-years/sections/${s.id}`} className="text-sm font-medium text-ink hover:text-accent transition-colors">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-prose">{s.gradeLevelName}</td>
                  <td className="px-5 py-3 text-sm text-prose">
                    <span className={isFull ? 'text-red-600 font-medium' : ''}>{s.activeEnrollments}</span>
                    <span className="text-ghost">/{s.maxCapacity}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-prose">{s.homeroomTeacherName ?? '—'}</td>
                  <td className="px-5 py-3">
                    {isFull ? (
                      <span className="inline-flex items-center bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-medium">Llena</span>
                    ) : (
                      <span className="inline-flex items-center bg-accent/30 text-ink/80 px-2.5 py-0.5 rounded-full text-xs font-medium">Disponible</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
