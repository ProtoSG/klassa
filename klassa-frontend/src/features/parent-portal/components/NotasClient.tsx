'use client'

import { useEffectiveChildId } from '../hooks/useEffectiveChildId'
import ChildPickerBar from './ChildPickerBar'
import type { StudentResponse, EnrollmentResponse } from '@/features/students/types'
import type { ScoreResponse } from '@/features/scores/types'

export interface ChildScores {
  student: StudentResponse
  enrollment: EnrollmentResponse | null
  scores: ScoreResponse[]
}

export default function NotasClient({ data }: { data: ChildScores[] }) {
  const effectiveId = useEffectiveChildId(data.map((d) => d.student.id))
  const current = data.find((d) => d.student.id === effectiveId)

  if (!current) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <p className="text-sm text-prose">No hay alumnos registrados en tu familia.</p>
      </div>
    )
  }

  const byPeriod = new Map<number, ScoreResponse[]>()
  for (const score of current.scores) {
    const bucket = byPeriod.get(score.period) ?? []
    bucket.push(score)
    byPeriod.set(score.period, bucket)
  }
  const periods = [...byPeriod.keys()].sort((a, b) => a - b)

  return (
    <div className="flex flex-col gap-3">
      <ChildPickerBar data={data} currentId={current.student.id} />

      {!current.enrollment ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="text-sm text-prose">{current.student.fullName} no tiene una matrícula activa.</p>
        </div>
      ) : current.scores.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="text-sm text-prose">Todavía no hay notas cargadas.</p>
        </div>
      ) : (
        periods.map((period) => (
          <div key={period} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-ghost px-1">Período {period}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {byPeriod.get(period)!.map((score) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card"
                >
                  <p className="text-sm font-medium text-ink">{score.subjectName}</p>
                  <span className="text-lg font-medium text-ink">{score.score}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
