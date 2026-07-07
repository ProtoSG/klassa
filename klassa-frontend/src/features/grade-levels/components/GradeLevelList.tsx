import type { GradeLevel, GradeLevelType } from '../types'
import NewGradeLevelDialog from './NewGradeLevelDialog'

const LEVEL_LABEL: Record<GradeLevelType, string> = {
  INITIAL: 'Inicial',
  PRIMARY: 'Primaria',
  SECONDARY: 'Secundaria',
}

const LEVEL_ORDER: GradeLevelType[] = ['INITIAL', 'PRIMARY', 'SECONDARY']

interface Props {
  grouped: Record<GradeLevelType, GradeLevel[]>
}

export default function GradeLevelList({ grouped }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-ink">Grados</h3>
        <NewGradeLevelDialog />
      </div>
      <div className="flex flex-col gap-4">
        {LEVEL_ORDER.map((level) => {
          const levels = grouped[level] ?? []
          return (
            <div key={level}>
              <p className="text-xs font-medium text-ghost mb-2">{LEVEL_LABEL[level]}</p>
              {levels.length === 0 ? (
                <p className="text-xs text-ghost">No hay grados registrados.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {levels.map((gl) => (
                    <span key={gl.id} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface text-sm text-ink border border-line">
                      {gl.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
