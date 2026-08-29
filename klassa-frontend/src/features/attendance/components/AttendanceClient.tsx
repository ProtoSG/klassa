'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import type { SectionResponse } from '@/features/sections/types'
import type { EnrollmentResponse } from '@/features/enrollments/types'
import type { AttendanceStatus } from '../types'
import {
  fetchEnrollmentsBySection,
  fetchAttendanceBySectionDate,
  registerAttendanceBatch,
} from '../actions'
import WhatsAppButton from '@/shared/components/WhatsAppButton'
import { templates } from '@/shared/lib/whatsapp'

interface Props {
  sections: SectionResponse[]
  defaultDate: string
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: 'Presente' },
  { value: 'ABSENT', label: 'Ausente' },
  { value: 'LATE', label: 'Tarde' },
  { value: 'JUSTIFIED', label: 'Justificado' },
]

function getStatusClass(status: AttendanceStatus, isCurrent: boolean): string {
  if (!isCurrent) {
    return 'border-line bg-white text-ghost hover:text-ink hover:border-ink/30'
  }
  const map: Record<AttendanceStatus, string> = {
    PRESENT: 'border-accent bg-accent text-ink',
    ABSENT: 'border-danger bg-danger text-white',
    LATE: 'border-warning bg-warning text-white',
    JUSTIFIED: 'border-blue-500 bg-blue-500 text-white',
  }
  return map[status]
}

export default function AttendanceClient({ sections, defaultDate }: Props) {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    sections[0]?.id ?? null,
  )
  const [date, setDate] = useState(defaultDate)

  // Server computes defaultDate in its own timezone (UTC), which can roll to
  // tomorrow for users behind UTC. Correct to the browser's local date on mount.
  useEffect(() => {
    const local = new Intl.DateTimeFormat('en-CA').format(new Date())
    setDate((prev) => (prev === defaultDate ? local : prev))
  }, [defaultDate])
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceStatus>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setSavedAt(null)
    if (!selectedSectionId) return
    setIsLoading(true)
    Promise.all([
      fetchEnrollmentsBySection(selectedSectionId),
      fetchAttendanceBySectionDate(selectedSectionId, date),
    ])
      .then(([enrolls, existing]) => {
        const active = enrolls.filter((e) => e.status === 'ACTIVE')
        setEnrollments(active)
        const map: Record<number, AttendanceStatus> = {}
        active.forEach((e) => {
          map[e.id] = 'PRESENT'
        })
        existing.forEach((r) => {
          map[r.enrollmentId] = r.status
        })
        setAttendanceMap(map)
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Error cargando datos')
      })
      .finally(() => setIsLoading(false))
  }, [selectedSectionId, date])

  function setStatus(enrollmentId: number, status: AttendanceStatus) {
    setAttendanceMap((prev) => ({ ...prev, [enrollmentId]: status }))
  }

  function handleSubmit() {
    if (!selectedSectionId || enrollments.length === 0) return
    startTransition(async () => {
      try {
        await registerAttendanceBatch(
          enrollments.map((e) => ({
            enrollmentId: e.id,
            date,
            status: attendanceMap[e.id] ?? 'PRESENT',
            note: '',
          })),
        )
        // Reload from DB to confirm saved state
        const confirmed = await fetchAttendanceBySectionDate(selectedSectionId, date)
        const map: Record<number, AttendanceStatus> = {}
        enrollments.forEach((e) => { map[e.id] = 'PRESENT' })
        confirmed.forEach((r) => { map[r.enrollmentId] = r.status })
        setAttendanceMap(map)
        setSavedAt(date)
        toast.success('Asistencia registrada')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al registrar asistencia')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-prose mb-1.5">Sección</label>
          <select
            value={selectedSectionId ?? ''}
            onChange={(e) => setSelectedSectionId(Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70"
          >
            {sections.length === 0 && <option value="">Sin secciones disponibles</option>}
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.gradeLevelName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-prose mb-1.5">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-ghost">Cargando...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-ghost">No hay alumnos matriculados en esta sección.</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-card">
            <div className="divide-y divide-line">
              {enrollments.map((enrollment) => {
                const current = attendanceMap[enrollment.id] ?? 'PRESENT'
                return (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {enrollment.studentName}
                      </p>
                      <p className="text-xs text-ghost mt-0.5">{enrollment.studentCode}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatus(enrollment.id, opt.value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${getStatusClass(opt.value, current === opt.value)}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs text-ghost">
                {enrollments.length} alumno{enrollments.length !== 1 ? 's' : ''}
              </p>
              {savedAt === date && (
                <span className="text-xs text-ink font-medium">✓ Guardado</span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Registrando...' : 'Registrar asistencia'}
            </button>
          </div>

          {/* Bulk WhatsApp reminder for absentees — opens one tab per absent guardian.
              Manual Send per WhatsApp Web deep link (no Meta API needed). */}
          {savedAt === date && (() => {
            const absentees = enrollments.filter(
              (e) => (attendanceMap[e.id] ?? 'PRESENT') === 'ABSENT',
            )
            if (absentees.length === 0) return null
            return (
              <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink">
                    {absentees.length} ausente{absentees.length !== 1 ? 's' : ''} hoy
                  </p>
                  <p className="text-xs text-ghost">
                    Abrí WhatsApp y presioná Enviar en cada chat
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {absentees.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-white border border-line px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{e.studentName}</p>
                        <p className="text-xs text-ghost">{e.studentCode}</p>
                      </div>
                      {e.guardianPhone ? (
                        <WhatsAppButton
                          phone={e.guardianPhone}
                          variant="full"
                          label="Notificar"
                          text={templates.attendanceAlert({
                            guardianName: e.guardianName ?? '',
                            studentName: e.studentName,
                            date: date,
                          })}
                        />
                      ) : (
                        <span className="text-xs text-ghost">Sin teléfono</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
