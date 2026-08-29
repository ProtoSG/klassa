'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import NewTeachingAssignmentDialog from './NewTeachingAssignmentDialog'
import { removeTeachingAssignment } from '../actions'
import type { TeachingAssignmentResponse } from '../types'
import type { Subject } from '@/features/subjects/types'
import type { UserResponse } from '@/features/users/types'

interface Props {
  sectionId: number
  initialAssignments: TeachingAssignmentResponse[]
  subjects: Subject[]
  teachers: UserResponse[]
  canManage: boolean
}

export default function SectionCourses({ sectionId, initialAssignments, subjects, teachers, canManage }: Props) {
  const [assignments, setAssignments] = useState(initialAssignments)
  useEffect(() => setAssignments(initialAssignments), [initialAssignments])
  const [removeTarget, setRemoveTarget] = useState<TeachingAssignmentResponse | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAssigned(assignment: TeachingAssignmentResponse) {
    setAssignments((prev) => [...prev.filter((a) => a.subjectId !== assignment.subjectId), assignment])
  }

  function handleRemove() {
    if (!removeTarget) return
    startTransition(async () => {
      try {
        await removeTeachingAssignment(removeTarget.id, sectionId)
        setAssignments((prev) => prev.filter((a) => a.id !== removeTarget.id))
        toast.success('Profesor removido de la materia')
        setRemoveTarget(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al remover profesor')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <h3 className="text-sm font-medium text-ink">Cursos</h3>
        {canManage && (
          <NewTeachingAssignmentDialog
            sectionId={sectionId}
            subjects={subjects}
            teachers={teachers}
            onAssigned={handleAssigned}
          />
        )}
      </div>
      {!assignments.length ? (
        <div className="p-10 text-center">
          <p className="text-sm text-ghost">Sin materias asignadas todavía.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-surface">
              <TableHead>Materia</TableHead>
              <TableHead>Profesor</TableHead>
              {canManage && <TableHead className="w-16" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-sm font-medium text-ink">{a.subjectName}</TableCell>
                <TableCell className="text-sm text-prose">{a.teacherName}</TableCell>
                {canManage && (
                  <TableCell>
                    <button
                      onClick={() => setRemoveTarget(a)}
                      className="p-1.5 rounded-lg text-ghost hover:text-danger hover:bg-danger/10 transition-colors duration-150"
                      title="Quitar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="¿Quitar profesor de la materia?"
        description={`${removeTarget?.teacherName} dejará de estar asignado a ${removeTarget?.subjectName} en esta sección.`}
        confirmLabel="Quitar"
        danger
        loading={isPending}
      />
    </div>
  )
}
