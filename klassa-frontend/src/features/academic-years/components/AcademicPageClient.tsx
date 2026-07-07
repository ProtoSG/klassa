'use client'

import { useState } from 'react'
import { getAcademicYears } from '@/features/academic-years/api'
import { getGradeLevelsGrouped } from '@/features/grade-levels/api'
import { getSubjects } from '@/features/subjects/api'
import { getSectionsByYear } from '@/features/sections/api'
import AcademicYearTable from '@/features/academic-years/components/AcademicYearTable'
import NewAcademicYearDialog from '@/features/academic-years/components/NewAcademicYearDialog'
import GradeLevelList from '@/features/grade-levels/components/GradeLevelList'
import SubjectTable from '@/features/subjects/components/SubjectTable'
import SectionTable from '@/features/sections/components/SectionTable'
import type { AcademicYearResponse } from '@/features/academic-years/types'
import type { GradeLevel, GradeLevelType } from '@/features/grade-levels/types'
import type { Subject } from '@/features/subjects/types'
import type { SectionResponse } from '@/features/sections/types'

const TABS = [
  { key: 'years', label: 'Años' },
  { key: 'grades', label: 'Grados' },
  { key: 'subjects', label: 'Materias' },
  { key: 'sections', label: 'Secciones' },
] as const

type TabKey = typeof TABS[number]['key']

interface Props {
  years: AcademicYearResponse[]
  grouped: Record<GradeLevelType, GradeLevel[]>
  subjects: Subject[]
  sections: SectionResponse[]
  activeYearId: number | null
}

export default function AcademicPageClient({ years, grouped, subjects, sections, activeYearId }: Props) {
  const [tab, setTab] = useState<TabKey>('years')
  const allGradeLevels = Object.values(grouped).flat()

  return (
    <div className="flex flex-col gap-5 px-4 md:px-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-medium text-ink">Académico</h1>
        <p className="text-prose text-sm mt-0.5">Gestión de años académicos, grados, materias y secciones</p>
      </div>

      {/* Tabs */}
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

      {/* Tab content */}
      {tab === 'years' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <NewAcademicYearDialog />
          </div>
          <AcademicYearTable years={years} />
        </div>
      )}

      {tab === 'grades' && (
        <GradeLevelList grouped={grouped} />
      )}

      {tab === 'subjects' && (
        <SubjectTable subjects={subjects} gradeLevels={allGradeLevels} />
      )}

      {tab === 'sections' && (
        <SectionTable
          sections={sections}
          academicYearId={activeYearId ?? years[0]?.id ?? 0}
          gradeLevels={allGradeLevels}
        />
      )}
    </div>
  )
}
