'use client'

import { useSelectedChild } from '@/shared/store/selected-child'
import type { StudentResponse } from '@/features/students/types'

/** Compact chip switcher shown at the top of Notas/Asistencia/Pagos when the
 * family has more than one child. The full card switcher lives on `/portal`. */
export default function ChildPickerBar({
  data,
  currentId,
}: {
  data: { student: StudentResponse }[]
  currentId: number
}) {
  const selectChild = useSelectedChild((s) => s.selectChild)

  if (data.length <= 1) return null

  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
      {data.map(({ student }) => {
        const active = student.id === currentId
        return (
          <button
            key={student.id}
            type="button"
            onClick={() => selectChild(student.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              active
                ? 'bg-ink text-white'
                : 'bg-white border border-line text-prose hover:border-trim'
            }`}
          >
            {student.firstName}
          </button>
        )
      })}
    </div>
  )
}
