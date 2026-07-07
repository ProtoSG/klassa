'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { changeStudentStatus } from '../actions'
import type { StudentStatus } from '../types'

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'TRANSFERRED', label: 'Trasladado' },
]

const STATUS_STYLE: Record<StudentStatus, string> = {
  ACTIVE: 'bg-accent/40 text-ink/80',
  INACTIVE: 'bg-muted-fill text-prose',
  TRANSFERRED: 'bg-amber-100 text-amber-700',
}

interface Props {
  studentId: number
  currentStatus: StudentStatus
}

export default function StatusChangeButton({ studentId, currentStatus }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(status: StudentStatus) {
    if (status === currentStatus || isPending) return
    setOpen(false)
    startTransition(async () => {
      try {
        await changeStudentStatus(studentId, status)
        toast.success('Estado actualizado')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
      }
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-white text-sm font-medium text-prose hover:text-ink hover:border-ink/20 transition-all duration-200 disabled:opacity-50',
        )}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[currentStatus].split(' ')[0]}`} />
            Estado
          </>
        )}
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-line bg-white shadow-card py-1 overflow-hidden">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleChange(value)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-150',
                  value === currentStatus
                    ? 'text-ink font-medium bg-surface'
                    : 'text-prose hover:bg-surface hover:text-ink',
                )}
              >
                <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[value].split(' ')[0]}`} />
                {label}
                {value === currentStatus && <Check size={14} className="ml-auto text-accent" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
