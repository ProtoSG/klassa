import type { AcademicYearResponse } from '../types'
import AcademicYearActions from './AcademicYearActions'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  years: AcademicYearResponse[]
}

export default function AcademicYearTable({ years }: Props) {
  if (!years.length) {
    return (
      <div className="rounded-2xl border border-line bg-white p-16 text-center shadow-card">
        <p className="text-prose text-sm">No hay años académicos registrados.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left text-xs font-medium text-ghost px-5 py-3">Nombre</th>
            <th className="text-left text-xs font-medium text-ghost px-5 py-3">Inicio</th>
            <th className="text-left text-xs font-medium text-ghost px-5 py-3">Fin</th>
            <th className="text-left text-xs font-medium text-ghost px-5 py-3">Estado</th>
            <th className="text-right text-xs font-medium text-ghost px-5 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {years.map((y) => (
            <tr key={y.id} className="border-b border-line last:border-0 hover:bg-surface transition-colors">
              <td className="px-5 py-3 text-sm font-medium text-ink">{y.name}</td>
              <td className="px-5 py-3 text-sm text-prose">{fmtDate(y.startDate)}</td>
              <td className="px-5 py-3 text-sm text-prose">{fmtDate(y.endDate)}</td>
              <td className="px-5 py-3">
                {y.active ? (
                  <span className="inline-flex items-center gap-1.5 bg-accent/30 text-ink/80 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink/50"></span>
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-muted-fill text-prose px-2.5 py-0.5 rounded-full text-xs font-medium">
                    Cerrado
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-right">
                <AcademicYearActions year={y} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
