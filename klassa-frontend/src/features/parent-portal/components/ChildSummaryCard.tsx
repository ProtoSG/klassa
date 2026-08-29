'use client'

import Link from 'next/link'
import { GraduationCap, ClipboardList, Receipt, ChevronRight } from 'lucide-react'
import { useEffectiveChildId } from '../hooks/useEffectiveChildId'
import type { StudentResponse, EnrollmentResponse } from '@/features/students/types'
import type { AttendancePercentageResponse } from '@/features/attendance/types'

export interface ChildSummary {
  student: StudentResponse
  enrollment: EnrollmentResponse | null
  sectionName: string | null
  percentage: AttendancePercentageResponse | null
  latestPeriodAvg: number | null
  balance: string | null
}

/**
 * Shown below `ChildrenSwitcher` on `/portal` — picking a child there used to
 * be a silent no-op (just highlighted the card, nothing else happened). This
 * surfaces the selected child's info right away instead of making a parent
 * hop across 3 tabs to piece it together.
 */
export default function ChildSummaryCard({ data }: { data: ChildSummary[] }) {
  const effectiveId = useEffectiveChildId(data.map((d) => d.student.id))
  const current = data.find((d) => d.student.id === effectiveId)

  if (!current) return null

  const pct = current.percentage ? parseFloat(current.percentage.percentage) : null
  const hasBalance = current.balance !== null && parseFloat(current.balance) > 0

  return (
    <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
      <div className="p-5">
        <p className="text-sm font-medium text-ink">{current.student.fullName}</p>
        <p className="text-xs text-ghost mt-0.5">
          {current.sectionName ?? 'Sin matrícula activa'} · {current.student.code}
        </p>

        {current.enrollment && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-xl bg-muted-fill p-3 text-center">
              <p className="text-lg font-medium text-ink">{pct !== null ? `${current.percentage!.percentage}%` : '—'}</p>
              <p className="text-[10px] text-ghost mt-0.5">Asistencia</p>
            </div>
            <div className="rounded-xl bg-muted-fill p-3 text-center">
              <p className="text-lg font-medium text-ink">
                {current.latestPeriodAvg !== null ? current.latestPeriodAvg.toFixed(1) : '—'}
              </p>
              <p className="text-[10px] text-ghost mt-0.5">Promedio</p>
            </div>
            <div className="rounded-xl bg-muted-fill p-3 text-center">
              <p className={`text-lg font-medium ${hasBalance ? 'text-danger' : 'text-ink'}`}>
                {current.balance !== null ? `S/ ${current.balance}` : '—'}
              </p>
              <p className="text-[10px] text-ghost mt-0.5">Saldo</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line divide-y divide-line">
        <Link href="/portal/notas" className="flex items-center justify-between px-5 py-3 text-sm text-ink hover:bg-muted-fill transition-colors duration-150">
          <span className="flex items-center gap-2"><GraduationCap size={15} className="text-ghost" /> Ver notas</span>
          <ChevronRight size={15} className="text-ghost" />
        </Link>
        <Link href="/portal/asistencia" className="flex items-center justify-between px-5 py-3 text-sm text-ink hover:bg-muted-fill transition-colors duration-150">
          <span className="flex items-center gap-2"><ClipboardList size={15} className="text-ghost" /> Ver asistencia</span>
          <ChevronRight size={15} className="text-ghost" />
        </Link>
        <Link href="/portal/pagos" className="flex items-center justify-between px-5 py-3 text-sm text-ink hover:bg-muted-fill transition-colors duration-150">
          <span className="flex items-center gap-2"><Receipt size={15} className="text-ghost" /> Ver cobros</span>
          <ChevronRight size={15} className="text-ghost" />
        </Link>
      </div>
    </div>
  )
}
