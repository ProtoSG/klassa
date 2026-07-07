'use client'

import { useState } from 'react'
import FeeSchedulesSection from './FeeSchedulesSection'
import InvoicesSection from './InvoicesSection'
import type { FeeScheduleResponse } from '../types'
import type { StudentResponse } from '@/features/students/types'

const TABS = [
  { key: 'invoices', label: 'Facturas' },
  { key: 'schedules', label: 'Aranceles' },
] as const

type TabKey = (typeof TABS)[number]['key']

interface Props {
  feeSchedules: FeeScheduleResponse[]
  students: StudentResponse[]
  activeYearId: number
}

export default function BillingPageClient({ feeSchedules, students, activeYearId }: Props) {
  const [tab, setTab] = useState<TabKey>('invoices')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1 bg-muted-fill rounded-xl p-1 border border-line w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === key
                ? 'bg-ink text-white shadow-card'
                : 'text-prose hover:text-ink hover:bg-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'invoices' && <InvoicesSection students={students} />}
      {tab === 'schedules' && (
        <FeeSchedulesSection initialSchedules={feeSchedules} academicYearId={activeYearId} />
      )}
    </div>
  )
}
